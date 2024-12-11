import passport from "passport";
import express from "express";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

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
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
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

    await newUser.save();

    // Phản hồi thành công
    res.redirect("/auth/register-form");
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
      // Handle unexpected errors
      return next(err);
    }
    if (!user) {
      // Authentication failed
      return res.status(401).json({ message: "Authentication failed. Invalid credentials." });
    }
    // Successful authentication
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const userId = user._id;
      res.redirect(`/profile?_id=${userId}`);
    });
  })(req, res, next);
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
