import passport from "passport";
import express from "express";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();
const resetTokens = new Map();

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (_id, done) => {
  try {
    console.log("Deserializing user:", _id);
    const user = await User.findById(_id);
    console.log("Found user:", user ? user._id : 'none');
    done(null, user);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err);
  }
});


// Register new user
router.post("/register", async (req, res) => {
  const { email, password, confirmPassword, name } = req.body;
  // Kiểm tra các trường bắt buộc
  if (!email || !password || !confirmPassword || !name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Kiểm tra confirmPassword
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
    });

    const user = await newUser.save();
    
    req.session.userId = user._id.toString();

    // Phản hồi thành công
    res.redirect("http://localhost:3000/register-form");
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// Log in existing user
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Explicitly save the session before redirecting
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        res.redirect("/profile");
      });
    });
  })(req, res, next);
});


// Gửi mã xác nhận qua email
router.post("/send-verificationCode", async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ error: "Email không tồn tại." });
      }

      // Tạo mã xác nhận ngẫu nhiên
      const verificationCode = crypto.randomInt(100000, 999999).toString();

      // Lưu mã vào bộ nhớ tạm
      resetTokens.set(email, verificationCode);

      // Cấu hình gửi email
      const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
              user: process.env.EMAIL_USER, // Email của bạn
              pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng
          },
      });

      // Nội dung email
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Mã xác nhận đổi mật khẩu",
          text: `Mã xác nhận của bạn là: ${verificationCode}`,
      };

      // Gửi email
      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Đã gửi mã xác nhận đến email." });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi gửi email." });
  }
});

// Xác nhận mã và đặt lại mật khẩu
router.post("/forgot-password", async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  try {
      // Kiểm tra mã xác nhận
      const savedCode = resetTokens.get(email);
      if (!savedCode || savedCode !== verificationCode) {
          return res.status(400).json({ error: "Mã xác nhận không đúng." });
      }

      // Xóa mã xác nhận khỏi bộ nhớ tạm
      resetTokens.delete(email);

      // Tìm người dùng
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ error: "Người dùng không tồn tại." });
      }

      // Mã hóa mật khẩu mới và lưu
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi hệ thống." });
  }
});


// Log out user
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Render login page
router.get("/login", (req, res) => {
  res.render("pages/login");
});

// Render register page
router.get("/register", (req, res) => {
  res.render("pages/register");
});

router.get("/logout", (req, res) => {
  res.send("Logging out");
});

router.get("/forget-password", async (req, res) => {
  res.render("pages/ForgetPasswordPage");
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

// Callback route for google redirect
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  res.send("You reach the callback URL");
});

export default router;
