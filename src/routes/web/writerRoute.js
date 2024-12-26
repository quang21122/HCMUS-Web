import express from "express";
import { getArticlesByAuthor } from "../../services/articleService.js";
import { createArticle } from "../../services/articleService.js";
import { getTags } from "../../services/tagService.js";
import { getCategories } from "../../services/categoryService.js";
import { findUserByName, findUser } from "../../services/userService.js";
import cache from "../../config/cache.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../../public", "uploads")); // Adjusted path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get("/my-articles", async (req, res) => {
  try {
    // const author = req.user.username;
    // const page = parseInt(req.query.page) || 1;

    // const userResponse = await findUserByName(author);
    // if (!userResponse.success) {
    //   return res.status(404).render("pages/404");
    // }

    // const articlesResponse = await getArticlesByAuthor(
    //   userResponse.data._id,
    //   page
    // );

    // if (!articlesResponse.success) {
    //   return res.status(500).json({ error: articlesResponse.error });
    // }

    // Get all tags
    const tagsResponse = await getTags();

    // Get all categories
    const categoriesResponse = await getCategories();

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const pageData = {
      title: `Bài viết của tôi`,
      tags: tagsResponse.data,
      categories: categoriesResponse.data,
      //   articles: articlesResponse.data.articles,
      //   pagination: articlesResponse.data.pagination,
      user: user,
    };

    res.render("pages/MyPostPage", pageData);
  } catch (error) {
    console.error("My articles page error:", error);
  }
});

// GET my-article/create

router.get("/my-articles/create", async (req, res) => {
  try {
    const tagsResponse = await getTags();
    const categoriesResponse = await getCategories();

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    // if user is not logged in, redirect to login page
    if (!user) {
      return res.redirect("/auth/login");
    }

    const articleCount = await getArticlesByAuthor(userId);

    const pageData = {
      title: "Tạo bài viết mới",
      tags: tagsResponse.data,
      categories: categoriesResponse.data,
      article: {
        title: "",
        author: "",
        abstract: "",
        content: "",
        is_premium: false,
      },
      user: user,
      articleCount: articleCount,
    };
    console.log(pageData);
    console.log(articleCount.data);

    res.render("pages/CreateArticlePage", pageData);
  } catch (error) {
    console.error("Create article page error:", error);
  }
});

router.post("/my-articles/create", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      abstract,
      content,
      category,
      tags,
      isPremium,
      status,
      publishedAt,
    } = req.body;

    console.log(req.body);

    const tagsResponse = await getTags();
    const categoriesResponse = await getCategories();
    // console.log(tagsResponse.data);
    // console.log(categoriesResponse.data);

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    // If user is not logged in, redirect to login page
    if (!user) {
      return res.redirect("/auth/login");
    }

    const articleCount = await getArticlesByAuthor(userId);

    // Check if required fields are present
    if (!name || !content || !abstract || !category || !tags) {
      console.log("Vui lòng điền đầy đủ thông tin");
      return res.status(400).render("pages/CreateArticlePage", {
        title: "Tạo bài viết mới",
        errorMessage: "Vui lòng điền đầy đủ thông tin",
        tags: tagsResponse.data,
        categories: categoriesResponse.data,
        article: {
          title: "",
          author: "",
          abstract: "",
          content: "",
          is_premium: false,
        },
        user: user,
        articleCount: articleCount,
      });
    }

    // convert tags and category to array
    const tagsArray = tags.split(",");
    const categoryArray = category.split(",");
    console.log(tagsArray);
    console.log(categoryArray);

    // Handle image upload if present
    // console.log("file: ", req.file);
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Prepare article data
    const articleData = {
      name,
      image,
      abstract,
      content,
      tags: tagsArray,
      category: categoryArray,
      isPremium,
      status,
      publishedAt,
      author: user._id,
    };
    console.log(articleData);

    // Call createArticle method
    const articleResponse = await createArticle(articleData);

    if (!articleResponse.success) {
      console.log("Có lỗi xảy ra. Vui lòng thử lại sau.");
      return res.status(500).render("pages/CreateArticlePage", {
        title: "Tạo bài viết mới",
        errorMessage: articleResponse.error,
        tags: tagsResponse.data,
        categories: categoriesResponse.data,
        article: {
          title: "",
          author: "",
          abstract: "",
          content: "",
          is_premium: false,
        },
        user: user,
        articleCount: articleCount,
      });
    }

    // Redirect after article creation
    res.redirect("/my-articles");
  } catch (error) {
    console.error("Create article error:", error);
    res.status(500).render("pages/CreateArticlePage", {
      title: "Tạo bài viết mới",
      errorMessage: "Có lỗi xảy ra. Vui lòng thử lại sau.",
    });
  }
});

export default router;
