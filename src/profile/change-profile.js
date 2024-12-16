import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

// Change password with _id in query string
router.post("/", async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.query._id; // Lấy _id từ query string
      console.log(userId);
      // Kiểm tra xem người dùng có đăng nhập không
      if (!userId) {
        return res.status(400).json({ error: "User not logged in." });
      }
  
      // Kiểm tra các trường nhập vào
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Please fill in all fields." });
      }
  
      // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp không
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ error: "New password and confirmation don't match." });
      }
  
      // Tìm người dùng theo userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect current password." });
      }
  
      // Mã hóa mật khẩu mới và lưu
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error." });
    }
  });
  

  
export default router;
