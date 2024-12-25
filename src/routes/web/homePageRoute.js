import express from "express";
import cache from "../../config/cache.js";
import { getArticles } from "../../services/articleService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Create timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 5000)
    );

    // Run queries in parallel with timeout
    const result = await Promise.race([
      Promise.all([getArticles(), getCategories(), getTags()]),
      timeout,
    ]);

    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
    }

    const cacheKey = "homepage";

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const [articlesResponse, categoriesResponse, tagsResponse] = result;

    if (!articlesResponse.success || !categoriesResponse.success) {
      throw new Error("Failed to fetch data");
    }

    // find author name for each article
    for (let i = 0; i < articlesResponse.data.length; i++) {
      const article = articlesResponse.data[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    const pageData = {
      title: "Trang chủ",
      articles: articlesResponse.data,
      categories: categoriesResponse.data,
      tags: tagsResponse.data,
      user: user,
    };

    cache.set(cacheKey, pageData);

    res.render("pages/HomePage", pageData);
  } catch (error) {
    console.error("Home route error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
