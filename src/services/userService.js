import { readFile } from 'fs/promises';
import User from '../models/User.js';
import mongoose from "mongoose";
import { verify } from 'crypto';
import { get } from 'http';

export const findUser = async (id) => {
    try {
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }

        // Tìm người dùng
        const user = await User.findById(id).exec();

        // Trả về người dùng hoặc không tìm thấy
        return user || { error: "User not found", status: 404 };
    }
    catch (error) {
        // Log lỗi và trả về lỗi
        console.error("Error reading user:", error);
        return { error: error.message, status: 500 };
    }
};

export const findUserByName = async (name) => {
    try {
        const user = await User.findOne({ name });

        if (!user) {
            return {
                success: false,
                error: "User not found",
            };
        }

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("findUserByName error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

const createUser = async (data) => {
    const userData = {
        name: data["name"],
        role: data["role"] || "guest", // Default role is 'guest' if not provided
        email: data["email"],
        password: data["password"], // Ensure the password is hashed before saving
        ban: data["ban"] || false, // Default to 'false' if not provided
        dob: data["dob"], // Parse date if necessary
        createdAt: data["createdAt"] || new Date(), // Default to the current date if not provided
        subscriptionExpiry: data["subscriptionExpiry"] || null, // Default to 'null'
        penName: data["penName"] || "", // Default to an empty string if not provided
        category: data["category"] || "", // Default to an empty string if not provided
        googleID: "",
        gender: data["gender"] || "",
        country: data["country"] || "",
        fullName: data["fullName"] || "",
        phone: data["phone"] || "",
        verify: false
    };

    try {
        // Create a new user instance using the User model
        const newUser = new User(userData);

        // Save the user to the database
        const savedUser = await newUser.save();

        // Return the saved user or a success message
        return { success: true, user: savedUser };
    } catch (error) {
        // Log the error and return a failure response
        console.error("Error creating user:", error);
        return { error: error.message, status: 500 };
    }
};

const createMultipleUsers = async (users) => {
    const results = [];

    for (const user of users) {
        const result = await createUser(user);
        results.push(result);
    }

    return results;
}

const importUsersFromLocal = async () => {
    // Read the local users.json file
    const data = await readFile('../crawler/userdb.json', 'utf8');
    const localUsers = JSON.parse(data);

    const results = await createMultipleUsers(localUsers);

    return results;
}

const updateUser = async (id, data) => {
    try {
        if (!data || Object.keys(data).length === 0) {
            return { error: "No data provided", status: 400 };
        }
        console.log("Service's data : ", data);
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }
        // Find the user by ID and update with the provided data
        const updatedUser = await User
            .updateOne({ _id: id }, data)
            .exec();
        // Return the updated user or a not found message
        return updatedUser || { error: "User not found", status: 404 };
    }
    catch (error) {
        // Log the error and return a failure response
        console.error("Error updating user:", error);
        return { error: error.message, status: 500 };
    }
}

const deleteUser = async (id) => {
    try {
        // Kiểm tra xem id có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }

        // Tìm và xóa người dùng theo ID
        const deletedUser = await User.deleteOne({ _id: id }).exec();

        // Kiểm tra kết quả xóa
        if (deletedUser.deletedCount === 0) {
            return { error: "User not found", status: 404 };
        }

        return { message: "User deleted successfully", status: 200 };
    }
    catch (error) {
        // Log lỗi và trả về phản hồi thất bại
        console.error("Error deleting user:", error);
        return { error: error.message, status: 500 };
    }
};


const getUsersByPage = async (page = 1, role = null) => {
    try {
        const limit = 10;
        // Tính toán số lượng bản ghi cần bỏ qua
        const skip = (page - 1) * limit;

        // Nếu role có giá trị, tìm người dùng có role đó nhưng không phải admin
        const query = {
            ...(role ? { role } : {}), // Nếu role có giá trị, thêm điều kiện role
            role: { ...(role ? { $eq: role } : {}), $ne: 'admin' }, // Loại trừ admin
        };

        // Truy vấn tổng số người dùng và danh sách người dùng theo trang
        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
        ]);

        return {
            success: true,
            data: users,
            pagination: {
                total, // Tổng số người dùng theo điều kiện role
                currentPage: page, // Trang hiện tại
                totalPages: Math.ceil(total / limit), // Tổng số trang
            },
        };
    } catch (error) {
        console.error("getUsersByPage error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

const searchUsersByPage = async (page = 1, query = "", role = null) => {
    try {
        const limit = 10;
        // Tính toán số lượng bản ghi cần bỏ qua
        const skip = (page - 1) * limit;

        // Xây dựng query tìm kiếm
        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Tìm kiếm theo tên (không phân biệt hoa thường)
                { email: { $regex: query, $options: 'i' } }, // Tìm kiếm theo email (không phân biệt hoa thường)
            ],
            ...(role ? { role } : {}), // Nếu role có giá trị, thêm điều kiện role
            role: { ...(role ? { $eq: role } : {}), $ne: 'admin' }, // Loại trừ admin
        };

        // Truy vấn tổng số người dùng và danh sách người dùng theo trang
        const [total, users] = await Promise.all([
            User.countDocuments(searchQuery),
            User.find(searchQuery)
                .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo mới nhất
                .skip(skip)
                .limit(limit)
                .lean()  // Để trả về các đối tượng JavaScript thay vì đối tượng Mongoose
                .exec(),
        ]);

        return {
            success: true,
            data: users,
            pagination: {
                total, // Tổng số người dùng theo điều kiện tìm kiếm và role
                currentPage: page, // Trang hiện tại
                totalPages: Math.ceil(total / limit), // Tổng số trang
            },
        };
    } catch (error) {
        console.error("searchUsersByPage error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};


export default { createUser, createMultipleUsers, importUsersFromLocal, findUser, updateUser, deleteUser, getUsersByPage, searchUsersByPage };
