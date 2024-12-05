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
} from "./services/articleService.js";
import { getCategories, getCategoryName } from "./services/categoriesService.js";
import { connectDB } from "./config/db.js";
import NodeCache from "node-cache";
import articleRoute from "./routes/articleRoute.js";
import userRoute from "./routes/userRoute.js";
import loginRegisterRoutes from "./strategies/local-strategy.js";
import passport from "./config/passport.js";
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
      Promise.all([getArticles(), getCategories()]),
      timeout,
    ]);

    const [articlesResponse, categoriesResponse] = result;

    if (!articlesResponse.success || !categoriesResponse.success) {
      throw new Error("Failed to fetch data");
    }

    const pageData = {
      title: "Trang chủ",
      articles: articlesResponse.data,
      categories: categoriesResponse.data,
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
        categoryNames, // Add category names array to article data
      },
      articleSameCategory: relatedResponse.data,
    };

    // Cache the data
    cache.set(cacheKey, articleData);

    res.render("pages/ArticlePage", articleData);
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const findCategoryFamily = (categories, targetCategory) => {
  try {
    if (!Array.isArray(categories) || !targetCategory) {
      console.log("Invalid input parameters");
      return [targetCategory];
    }

    // Find target category first
    const target = categories.find((cat) => cat._id === targetCategory._id);
    if (!target) {
      return [targetCategory];
    }

    if (target.parent === null) {
      // If target is parent, find all its children
      const children = categories.filter((cat) => cat.parent === target._id);
      return [target, ...children];
    } else {
      // If target is child, find its parent and siblings
      const parent = categories.find((cat) => cat._id === target.parent);
      const siblings = categories.filter((cat) => cat.parent === target.parent);
      return parent ? [parent, ...siblings] : [targetCategory];
    }
  } catch (error) {
    console.error("findCategoryFamily error:", error);
    return [targetCategory];
  }
};

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

    const pageData = {
      title: categoryName,  
      articles: articleResponse.data,
      categories: categoriesResponse.data,
      currentCategory: category._id,
      categoryFamily,
      pagination: articleResponse.pagination,
    };

    // Cache the result
    cache.set(cacheKey, pageData, 300);

    res.render("pages/CategoriesPage", pageData);
  } catch (error) {
    console.error("Category route error:", error);
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
