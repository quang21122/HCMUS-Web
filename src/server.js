import express from "express";
import sessionMiddleware from "./config/session.js";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import session from "express-session";
import flash from "connect-flash";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import articleAPIRoute from "./routes/api/articleRoute.js";
import userRoute from "./routes/api/userRoute.js";
import loginRegisterRoutes from "./strategies/local-strategy.js";
import homePageRoute from "./routes/web/homePageRoute.js";
import articleRoute from "./routes/web/articleRoute.js";
import categoryRoute from "./routes/web/categoryRoute.js";
import profileRoute from "./routes/web/profileRoute.js";
import tagRoute from "./routes/web/tagRoute.js";
import authRoute from "./routes/web/authRoute.js";
import authorRoute from "./routes/web/authorRoute.js";
import passport from "./config/passport.js";
import changeInProfile from "./profile/change-profile.js";
import searchRoute from "./routes/web/searchRoute.js";
import newestRoute from "./routes/web/newestRoute.js";
import trendRoute from "./routes/web/trendRoute.js";
import editorRoute from "./routes/web/editorRoute.js";
import writerRoute from "./routes/web/writerRoute.js";
import multer from "multer";
import commentRoute from "./routes/web/commentRoute.js"
import adminRoute from "./routes/web/adminRoute.js"
import adminApproveArticleRoute from "./routes/web/adminApproveArticleRoute.js"

// Create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views"),
  path.join(__dirname, "public"),
]);

const app = express();
app.use(express.static("public"));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Endpoint for uploading images
app.post("/upload-image", upload.single("image"), (req, res) => {
  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`; // Path to the uploaded image
    res.json({ success: true, imageUrl: imageUrl });
  } else {
    res.status(400).json({ success: false, message: "No image uploaded" });
  }
});

// Serve static files (e.g., uploaded images)
app.use("/uploads", express.static("uploads"));

// Set EJS as the view engine
app.set("view engine", "ejs");
// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Add livereload to the middleware stack
app.use(connectLiveReload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

//truyền path cho navbar
app.use((req, res, next) => {
  res.locals.currentPath = req.path; // Đường dẫn hiện tại
  next();
});

app.use("/", commentRoute);
app.use("/", homePageRoute);
app.use("/", articleRoute);
app.use("/", trendRoute);
app.use("/", newestRoute);
app.use("/", categoryRoute);
app.use("/", tagRoute);
app.use("/", authRoute);
app.use("/", profileRoute);
app.use("/", authorRoute);
app.use("/", adminRoute);
app.use("/api/articles", articleAPIRoute);
app.use("/api/users", userRoute);
app.use("/auth", loginRegisterRoutes);
app.use("/profile", changeInProfile);
app.use("/", searchRoute);
app.use("/editor", editorRoute);
app.use("/writer", writerRoute);
app.use("/admin-approve", adminApproveArticleRoute);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

const startServer = async () => {
  try {
    await connectDB();

    app.listen(3000, () => {
      console.log("Server listening on port 3000");
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
