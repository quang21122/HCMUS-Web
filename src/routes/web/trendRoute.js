import express from "express";
import { getArticlesByPageWithSort } from "../../services/articleService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";

const router = express.Router();

router.get("/trend", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Create timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 5000)
    );

    // Run queries in parallel with timeout
    const result = await Promise.race([
      Promise.all([
        getArticlesByPageWithSort(page, 12, "views", -1),
        getCategories(),
        getTags(),
      ]),
      timeout,
    ]);

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const [articlesResponse, categoriesResponse, tagsResponse] = result;

    // find author name for each article
    for (let i = 0; i < articlesResponse.data.length; i++) {
      const article = articlesResponse.data[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    const pageData = {
      title: "Xu hướng",
      articles: articlesResponse.data,
      categories: categoriesResponse.data,
      tags: tagsResponse.data,
      pagination: articlesResponse.pagination,
      user: user,
    };

    res.render("pages/TrendPage", pageData);
  } catch (error) {
    console.error("Trend route error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
