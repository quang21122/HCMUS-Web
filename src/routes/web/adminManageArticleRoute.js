import express from "express";
import { getAllArticlesByPage } from "../../services/articleService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;
    if (!user || user.role !== "admin") {
      return res.redirect("/");
    }

    const page = parseInt(req.query.page) || 1;

    // Create timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 5000)
    );

    // Run queries in parallel with timeout
    const result = await Promise.race([
      Promise.all([getAllArticlesByPage(page, 12), getCategories(), getTags()]),
      timeout,
    ]);

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
      title: "Mới nhất",
      articles: articlesResponse.data,
      categories: categoriesResponse.data,
      tags: tagsResponse.data,
      pagination: articlesResponse.pagination,
      user: user,
    };

    res.render("pages/ManageArticlePage", pageData);
  } catch (error) {
    console.error("ManageArticle route error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
