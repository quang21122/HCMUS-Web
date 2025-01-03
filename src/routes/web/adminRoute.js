import express from "express";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import userService from "../../services/userService.js";
import User from "../../models/User.js";
import Category from "../../models/Category.js";

const { findUser, getUsersByPage, searchUsersByPage, getSubscribersWithTrueVerifiedByPage, searchSubscribersWithTrueVerifiedByPage } = userService;

const router = express.Router();

router.get("/manage-users/:currentTab/search", async (req, res) => {
    try {
        const currentTab = req.params.currentTab || "ban-users";
        const page = parseInt(req.query.page) || 1;
        const searchUser = req.query.searchUser;
        let role;
        if (currentTab === "ban-users") {
            role = null;
        } else if (currentTab === "verify-editors") {
            role = "editor";
        } else if (currentTab === "extend-subscription") {
            role = "subscriber";
        } else if (currentTab === "verify-authors") {
            role = "author";
        } else if (currentTab === "verify-subscribers") {
            role = "subscriber";
        }

        // Create timeout promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
        );
        let result;
        // Run queries in parallel with timeout
        if (currentTab === "extend-subscription") {
            result = await Promise.race([
                Promise.all([searchSubscribersWithTrueVerifiedByPage(page, searchUser, role), getCategories(), getTags()]),
                timeout,
            ]);
        } else {
            result = await Promise.race([
                Promise.all([searchUsersByPage(page, searchUser, role), getCategories(), getTags()]),
                timeout,
            ]);
        }

        if (!req.isAuthenticated()) {
            console.log("User not authenticated");
        }

        const userId = req.user?._id;
        const user = req.user || (userId && (await findUser(userId))) || null;

        if (!user || user.role !== "admin") {
            return res.redirect("/");
        }


        const [usersResponse, categoriesResponse, tagsResponse] = result;

        const pageData = {
            title: "Quản lý người dùng",
            users: usersResponse.data,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
            pagination: usersResponse.pagination,
            user: user,
            currentTab: currentTab
        };
        res.render("pages/ManageUserPage", pageData);
    } catch (error) {
        console.error("ManageUser route error:", error);
        res.status(500).send("Server error");
    }
});


router.get("/manage-users/:currentTab", async (req, res) => {
    try {
        const currentTab = req.params.currentTab || "ban-users";
        const page = parseInt(req.query.page) || 1;
        let role;
        if (currentTab === "ban-users") {
            role = null;
        } else if (currentTab === "verify-editors") {
            role = "editor";
        } else if (currentTab === "extend-subscription") {
            role = "subscriber";
        } else if (currentTab === "verify-authors") {
            role = "author";
        } else if (currentTab === "verify-subscribers") {
            role = "subscriber";
        }

        // Create timeout promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
        );

        // Run queries in parallel with timeout
        let result;
        // Run queries in parallel with timeout
        if (currentTab === "extend-subscription") {
            result = await Promise.race([
                Promise.all([getSubscribersWithTrueVerifiedByPage(page, role), getCategories(), getTags()]),
                timeout,
            ]);
        } else {
            result = await Promise.race([
                Promise.all([getUsersByPage(page, role), getCategories(), getTags()]),
                timeout,
            ]);
        }

        if (!req.isAuthenticated()) {
            console.log("User not authenticated");
        }

        const userId = req.user?._id;
        const user = req.user || (userId && (await findUser(userId))) || null;

        if (user.role !== "admin") {
            return res.redirect("/");
        }

        const [usersResponse, categoriesResponse, tagsResponse] = result;

        const pageData = {
            title: "Quản lý người dùng",
            users: usersResponse.data,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
            pagination: usersResponse.pagination,
            user: user,
            currentTab: currentTab
        };
        res.render("pages/ManageUserPage", pageData);
    } catch (error) {
        console.error("ManageUser route error:", error);
        res.status(500).send("Server error");
    }
});

router.post('/extend-subscription/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const additionalMinutes = 10080; // Gia hạn thêm 7 ngày (10080 phút)

        // Tìm người dùng theo userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Cộng thêm 10080 phút vào subscriptionExpiry
        const newExpiry = user.subscriptionExpiry + additionalMinutes;
        // Cập nhật vào cơ sở dữ liệu
        user.subscriptionExpiry = newExpiry;
        await user.save();

        // Sau khi cập nhật, chuyển hướng về trang quản lý người dùng với thông báo thành công
        res.redirect('/manage-users/extend-subscription');
    } catch (error) {
        console.error('Error extending subscription:', error);
        res.status(500).send('An error occurred while extending subscription');
    }
});

router.post('/manage-users/verify-editor/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { categoryId } = req.body; // Lấy id của category từ form

        // Kiểm tra xem categoryId có tồn tại không
        const category = await Category.collection.findOne({ _id: categoryId }); // Đảm bảo categoryId là ObjectId
        if (!category) {
            return res.status(400).send('Category not found');
        }

        // Cập nhật người dùng với categoryId và verified là true
        const user = await User.findByIdAndUpdate(
            userId,
            {
                category: categoryId, // Cập nhật category
                verified: true // Đặt verified thành true
            },
            { new: true } // Trả về người dùng đã được cập nhật
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Redirect hoặc render lại trang
        res.redirect('/manage-users/verify-editors'); // Hoặc redirect đến trang người dùng cụ thể
    } catch (error) {
        console.error('Error in verifying user:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/ban-user/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        // Cập nhật trạng thái ban thành true
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { ban: true },
            { new: true } // Trả về bản ghi đã được cập nhật
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }

        res.json({ success: true, message: "Người dùng đã bị cấm.", data: updatedUser });
    } catch (error) {
        console.error("Ban user error:", error);
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi." });
    }
});

router.post('/manage-users/verify-author/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Cập nhật người dùng 
        const user = await User.findByIdAndUpdate(
            userId,
            {
                verified: true // Đặt verified thành true
            },
            { new: true } // Trả về người dùng đã được cập nhật
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Redirect hoặc render lại trang
        res.redirect('/manage-users/verify-authors'); // Hoặc redirect đến trang người dùng cụ thể
    } catch (error) {
        console.error('Error in verifying user:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/manage-users/verify-subscriber/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Cập nhật người dùng 
        const user = await User.findByIdAndUpdate(
            userId,
            {
                verified: true // Đặt verified thành true
            },
            { new: true } // Trả về người dùng đã được cập nhật
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Redirect hoặc render lại trang
        res.redirect('/manage-users/verify-subscribers'); // Hoặc redirect đến trang người dùng cụ thể
    } catch (error) {
        console.error('Error in verifying user:', error);
        res.status(500).send('Internal Server Error');
    }
});


export default router;