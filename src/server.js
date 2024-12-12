import express from "express";
import session from "express-session";
import ejs from "ejs";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import { fileURLToPath } from "url";
import {
  getArticlesById,
  getArticlesSameCategory,
  getArticlesByCategory,
  getArticles,
  getArticlesByTag,
} from "./services/articleService.js";
import {
  getCategories,
  getCategoryName,
  findCategoryFamily,
} from "./services/categoriesService.js";
import { getTags, getTagName } from "./services/tagsService.js";
import { findUser } from "./services/userService.js";
import { connectDB } from "./config/db.js";
import NodeCache from "node-cache";
import articleRoute from "./routes/articleRoute.js";
import userRoute from "./routes/userRoute.js";
import loginRegisterRoutes from "./strategies/local-strategy.js";
import passport from "./config/passport.js";
import { compareSync } from "bcrypt";
export const PassportSetup = passport;

const cache = new NodeCache({ stdTTL: 300 });

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
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  })
);

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

app.get("/", async (req, res) => {
  try {
    const cacheKey = "homepage";

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/HomePage", cachedData);
    }

    // Create timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 5000)
    );

    // Run queries in parallel with timeout
    const result = await Promise.race([
      Promise.all([getArticles(), getCategories(), getTags()]),
      timeout,
    ]);

    const [articlesResponse, categoriesResponse, tagsResponse] = result;

    if (!articlesResponse.success || !categoriesResponse.success) {
      throw new Error("Failed to fetch data");
    }

    const pageData = {
      title: "Trang chủ",
      articles: articlesResponse.data,
      categories: categoriesResponse.data,
      tags: tagsResponse.data,
    };

    // Cache the result
    cache.set(cacheKey, pageData);

    res.render("pages/HomePage", pageData);
  } catch (error) {
    console.error("Home route error:", error);
    res.status(500).send("Server error");
  }
});

app.use("/api/articles", articleRoute);
app.use("/api/users", userRoute);
app.use("/auth", loginRegisterRoutes);

// Modified article route with caching
app.get("/article/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    const cacheKey = `article_${articleId}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/ArticlePage", cachedData);
    }

    // Get article by ID
    const response = await getArticlesById(articleId);

    if (!response.success) {
      return res.status(404).send(response.error);
    }

    const article = response.data;

    // Get category names
    const categoryNames = await Promise.all(
      article.category.map((catId) => getCategoryName(catId))
    );

    const tagsResponse = await getTags();

    // Get tag names
    const tagNames = await Promise.all(
      article.tags.map((tagId) => getTagName(tagId))
    );

    const relatedResponse = await getArticlesSameCategory(
      article.category[0],
      articleId
    );

    if (!relatedResponse.success) {
      return res
        .status(500)
        .json({ success: false, error: relatedResponse.error });
    }

    const articleData = {
      title: article.name,
      article: {
        ...article,
        categoryNames,
        tagNames,
      },
      articleSameCategory: relatedResponse.data,
      tags: tagsResponse.data,
    };

    // Cache the data
    cache.set(cacheKey, articleData);

    res.render("pages/ArticlePage", articleData);
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get("/categories/:category", async (req, res) => {
  try {
    const categoryName = req.params.category;
    const cacheKey = `category_${categoryName}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/CategoriesPage", cachedData);
    }

    // Get all categories first
    const categoriesResponse = await getCategories();
    if (!categoriesResponse.success) {
      return res.status(500).json({ error: categoriesResponse.error });
    }

    // Find category by name
    const category = categoriesResponse.data.find(
      (cat) => cat.name === categoryName
    );

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Get articles using category ID
    const articleResponse = await getArticlesByCategory(category._id);
    if (!articleResponse.success) {
      return res.status(500).json({ error: articleResponse.error });
    }

    const categoryFamily = findCategoryFamily(
      categoriesResponse.data,
      category
    );

    const tagsResponse = await getTags();

    const pageData = {
      title: categoryName,  
      articles: articleResponse.data,
      categories: categoriesResponse.data,
      currentCategory: category._id,
      categoryFamily,
      pagination: articleResponse.pagination,
      tags: tagsResponse.data,
    };

    // Cache the result
    cache.set(cacheKey, pageData, 300);

    res.render("pages/CategoriesPage", pageData);
  } catch (error) {
    console.error("Category route error:", error);
    res.status(500).send("Server error");
  }
});

app.get("/tags/:tag", async (req, res) => {
  try {
    const tagName = decodeURIComponent(req.params.tag);
    const categoryName = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const cacheKey = `tag_${tagName}_category_${categoryName}_page_${page}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/TagsPage", cachedData);
    }

    const categoriesResponse = await getCategories();

    const category = categoriesResponse.data.find(
      (cat) => cat.name === categoryName
    );

    const tagsResponse = await getTags();
    const tag = tagsResponse.data.find((t) => t.name === tagName);

    const articlesResponse = await getArticlesByTag(tag._id, page, 12, category);


    if (!articlesResponse.success) {
      return res.status(404).send(articlesResponse.error);
    }

    const pageData = {
      title: category ? `#${tagName} - ${categoryName}` : `#${tagName}`,
      articles: articlesResponse.data,
      currentTag: tagName,
      currentCategory: categoryName,
      categories: categoriesResponse.data,
      tags: tagsResponse.data || [],
      pagination: articlesResponse.pagination,
    };

    // Cache the result
    cache.set(cacheKey, pageData);

    res.render("pages/TagsPage", pageData);
  } catch (error) {
    console.error("Tags route error:", error);
    res.status(500).send("Server error");
  }
});

app.post("/register-form", (req, res) => {
  const { step, role, formData } = req.body;
  console.log(req.body); // Debug: Check form data

  if (step === 2) {
    // Store role in session
    req.session.role = role;
  } else if (step === 3) {
    // Store step 2 form data in session
    req.session.step2Data = formData;
  }

  // Store current step in session
  req.session.step = parseInt(step);
  console.log("Session: ", req.session); // Debug: Check session data

  // Redirect to render the next step
  res.redirect("/register-form");
});

app.get("/register-form", (req, res) => {
  const step = req.session.step || 1;
  const role = req.session.role || "";
  const step2Data = req.session.step2Data || {};

  res.render("pages/RegisterForm", {
    title: "Register Form",
    step,
    role,
    step2Data,
  });
});


app.post("/register", (req, res) => {
  const { role, step2Data } = req.session;

  if (!role || !step2Data) {
    return res.status(400).send("Thiếu thông tin cần thiết.");
  }

  const { name, email, dob, phone, gender, nationality, penName } = {
    ...step2Data,
  };

  // Nếu vai trò là writer, bút danh là bắt buộc
  if (role === "writer" && !penName) {
    return res.status(400).send("Bút danh là bắt buộc cho vai trò Phóng viên.");
  }

  // Xử lý lưu dữ liệu vào cơ sở dữ liệu (giả lập)
  const user = {
    role,
    name,
    email,
    dob,
    phone,
    gender,
    nationality,
    penName: role === "writer" ? penName : null,
  };

  console.log("User registered:", user);

  // Xóa session sau khi đăng ký
  req.session.destroy();

  res.status(200).send("Đăng ký thành công.");
});


app.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await findUser(userId);
    const categoriesResponse = await getCategories();
    const tagsResponse = await getTags();

    if (user.error) {
      return res.status(user.status).send(user.error);
    }

    const pageData = {
      title: "Profile",
      user,
      categories: categoriesResponse.data,
      tags: tagsResponse.data,
    }

    res.render("pages/ProfilePage", pageData);

  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).send("Server error");
  }
});


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