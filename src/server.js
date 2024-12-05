import express from "express";
import ejs from "ejs";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import { fileURLToPath } from "url";
// import { getArticles } from "./getArticles.js";
import {
  getArticlesById,
  getArticlesSameCategory,
  getArticlesByCategory,
  getArticles,
  getCategorizedArticles,
} from "./getArticles-1.js";
import { connectDB } from "./db.js";
import NodeCache from "node-cache";
import articleRoute from './routes/articleRoute.js';
import userRoute from './routes/userRoute.js';

const cache = new NodeCache({ stdTTL: 300 });

// Tạo __dirname
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

// Connect to the database
connectDB();

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
      Promise.all([getArticles(), getCategorizedArticles()]),
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

app.use(express.static('public'));
app.use(express.json());

app.use('/api/articles', articleRoute);
app.use('/api/users', userRoute);


// Render the index page
app.get('/', (req, res) => {
  const data = {
    title: 'SSR Web',
    message: 'This is a dynamic message from the server'
  };
  res.render('index', data);
});

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

    const response = await getArticlesById(articleId);
    if (!response.success) {
      return res.status(404).send(response.error);
    }

    const article = response.data;
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
      article,
      articleSameCategory: relatedResponse.data,
    };

    // Cache the data
    cache.set(cacheKey, articleData);

    if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
      return res.json({
        success: true,
        data: articleData,
      });
    }

    res.render("pages/ArticlePage", articleData);
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const findCategoryFamily = (categories, targetCategory) => {
  try {
    // Check if target is a parent category
    const asParent = categories.find(
      (cat) => cat.parentCategory === targetCategory
    );
    if (asParent) {
      return [asParent.parentCategory, ...asParent.childCategories];
    }

    // Check if target is a child category
    const parentCat = categories.find((cat) =>
      cat.childCategories.includes(targetCategory)
    );
    if (parentCat) {
      return [parentCat.parentCategory, ...parentCat.childCategories];
    }

    // If not found, return array with just target
    return [targetCategory];
  } catch (error) {
    console.error("findCategoryFamily error:", error);
    return [targetCategory];
  }
};

app.get("/categories/:category", async (req, res) => {
  try {
    const currentCategory = decodeURIComponent(req.params.category);
    const page = parseInt(req.query.page) || 1;
    const cacheKey = `category_${currentCategory}_page_${page}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/CategoriesPage", cachedData);
    }

    // Run queries in parallel
    const [categoriesResponse, articleResponse] = await Promise.all([
      getCategorizedArticles(),
      getArticlesByCategory(currentCategory, page),
    ]);

    if (!currentCategory) {
      return res.status(400).json({
        success: false,
        error: "Category parameter is required",
      });
    }

    const categoryFamily = findCategoryFamily(
      categoriesResponse.data,
      currentCategory
    );

    const pageData = {
      title: currentCategory,
      articles: articleResponse.data,
      categories: categoriesResponse.data,
      currentCategory,
      categoryFamily,
      pagination: articleResponse.pagination,
    };

    // Cache the result
    cache.set(cacheKey, pageData, 300); // Cache for 5 minutes

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
