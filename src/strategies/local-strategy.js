import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import express from "express";
import passport from "passport";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User.js";
import UserVerification from "../models/UserVerification.js";
import PasswordReset from "../models/PasswordReset.js";
import axios from 'axios';


dotenv.config();
const resetTokens = new Map();
const router = express.Router();

// Cấu hình gửi email
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.AUTH_EMAIL, // Email của bạn
    pass: process.env.AUTH_PASS, // Mật khẩu ứng dụng
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

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
    const user = await User.findById(_id);
    done(null, user);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err);
  }
});


// Hàm xác minh CAPTCHA
const verifyCaptcha = async (captchaResponse) => {
  const secretKey = "6LfyvaoqAAAAAPi5zzSUmgOOqyfOrBAaQpmS8iZb"; // Thay bằng secret key của bạn
  console.log(captchaResponse);
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: captchaResponse,
        },
      }
    );
    console.log('CAPTCHA verification response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    throw new Error('CAPTCHA verification service unavailable');
  }
};

router.post('/register', async (req, res) => {
  const { email, password, confirmPassword, name, captchaResponse } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!email || !password || !confirmPassword || !name || !captchaResponse) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Kiểm tra mật khẩu khớp
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Xác minh CAPTCHA
    const isCaptchaValid = await verifyCaptcha(captchaResponse);
    if (!isCaptchaValid) {
      return res.status(400).json({ message: 'CAPTCHA verification failed' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' }); // 409: Conflict
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      verified: false, // Giả sử cần xác thực qua email
    });

    const user = await newUser.save();

    // Lưu session hoặc token (tùy chọn)
    req.session.userId = user._id.toString();

    // Phản hồi thành công
    res.redirect("/register-form");
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Log in existing user
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/auth/login?error=invalid_credentials");
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
        res.redirect("/");
      });
    });
  })(req, res, next);
});

//Logout
router.post("/logout", async (req, res, next) => {
  try {
    // Step 1: Logout user
    await new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Step 2: Destroy session
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Step 3: Clear cookie and redirect
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Step 4: Force redirect with 302 status
    return res.status(302).redirect("/");
  } catch (err) {
    console.error("Logout failed:", err);
    return res.redirect("/");
  }
});

//Password reset stuff
router.post("/requestPasswordReset", (req, res) => {
  const { email } = req.body;
  User.find({ email })
    .then((data) => {
      if (data.length) {
        //user exists
        console.log(data[0]);

        //check if user is verified
        if (data[0].verified) {
          res.json({
            status: "FAILED",
            message: "Email hasn't been verified yet. Check your inbox",
          });
        } else {
          //proceed with email to reset password
          sendResetEmail(data[0], res);
        }
      } else {
        res.json({
          status: "FAILED",
          message: "No account with the supplied email exists",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.json({
        status: "FAILED",
        message: "An error occurred while checking for existing user",
      });
    });
});

//send password reset email
const sendResetEmail = ({ _id, email }, res) => {
  const resetString = uuidv4();

  //Clear all existing reset records
  PasswordReset.deleteMany({ userId: _id })
    .then((result) => {
      //reset records deleted successfully
      console.log(`/${_id}/${resetString}`);

      //mail option
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password Reset ",
        html: `<p>We heard that you lost the password.</p>
             <p>Don't worry, use the code below to reset it.</p>
             <p>This code expires in 60 minutes.</p>
             <p>Code <b>${resetString}</b> to proceed.</p>`,
      };

      //hash the reset string
      const saltRounds = 10;
      bcrypt
        .hash(resetString, saltRounds)
        .then((hashedResetString) => {
          //set values in password reset collection
          const newPasswordReset = new PasswordReset({
            userId: _id,
            resetString: hashedResetString,
            createdAt: Date.now(),
            expireAt: Date.now() + 3600000,
          });

          newPasswordReset
            .save()
            .then(
              transporter
                .sendMail(mailOptions)
                .then(() => {
                  //reset email sent and password reset record saved
                  res.json({
                    status: "PENDING",
                    message: "Password reset email sent ",
                  });
                })
                .catch((error) => {
                  console.log(error);
                  res.json({
                    status: "FAILED",
                    message: "Password reset email failed ",
                  });
                })
            )
            .catch((error) => {
              console.log(error);
              res.json({
                status: "FAILED",
                message: "Couldn't save password reset data ",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "FAILED",
            message:
              "An error occurred while hashing the password reset data! ",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        status: "FAILED",
        message: "Clearing existing password reset records failed",
      });
    });
};

// Xác nhận mã và đặt lại mật khẩu
router.post("/resetPassword", async (req, res) => {
  try {
      let { email, resetString, newPassword } = req.body;

      // Tìm người dùng theo email
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({
              status: "FAILED",
              message: "Người dùng với email này không tồn tại",
          });
      }

      const userId = user._id; // Lấy userId từ kết quả truy vấn

      // Tìm trong PasswordReset bằng userId
      const resetRecords = await PasswordReset.find({ userId });
      if (resetRecords.length === 0) {
          return res.status(404).json({
              status: "FAILED",
              message: "Yêu cầu đặt lại mật khẩu không tồn tại",
          });
      }

      const { expireAt, resetString: hashedResetString } = resetRecords[0];

      // Kiểm tra xem link đặt lại mật khẩu đã hết hạn chưa
      if (expireAt < Date.now()) {
          await PasswordReset.deleteOne({ userId }); // Xóa record đã hết hạn
          return res.status(400).json({
              status: "FAILED",
              message: "Link đặt lại mật khẩu đã hết hạn",
          });
      }

      // Kiểm tra resetString
      const isResetStringValid = await bcrypt.compare(resetString, hashedResetString);
      if (!isResetStringValid) {
          return res.status(400).json({
              status: "FAILED",
              message: "Mã xác nhận không hợp lệ",
          });
      }

      // Hash mật khẩu mới
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Cập nhật mật khẩu người dùng
      await User.updateOne({ _id: userId }, { password: hashedNewPassword });

      // Xóa record đặt lại mật khẩu
      await PasswordReset.deleteOne({ userId });

      // Trả về thành công
      return res.status(200).json({
          status: "SUCCESS",
          message: "Đặt lại mật khẩu thành công",
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          status: "FAILED",
          message: "Đã xảy ra lỗi khi xử lý yêu cầu",
      });
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
