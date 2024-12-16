import express from "express";
import sessionMiddleware from "./config/session.js";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
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
import changeInProfile from "./profile/change-password.js"

// Create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views"),
  path.join(__dirname, "public"),
]);

const app = express();

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

app.use("/", homePageRoute);
app.use("/", articleRoute);
app.use("/", categoryRoute);
app.use("/", tagRoute);
app.use("/", authRoute);
app.use("/", profileRoute);
app.use("/", authorRoute);
app.use("/api/articles", articleAPIRoute);
app.use("/api/users", userRoute);
app.use("/auth", loginRegisterRoutes);
app.use("/profile", changeInProfile);

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