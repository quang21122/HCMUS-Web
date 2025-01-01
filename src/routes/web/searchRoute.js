import express from "express";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";
import { getCategories } from "../../services/categoryService.js";
import Article from "../../models/Article.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Keep existing user and category data fetching
    const tagsResponse = await getTags();
    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;
    const categories = await getCategories();

    if (!query) return res.redirect("/");

    const totalArticles = await Article.countDocuments({
      $text: { $search: query },
    });

    // Full text search with weights
    const articles = await Article.find(
      {
        $text: { $search: query },
        status: "published",
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({
        isPremium: -1, // Premium articles first
        score: { $meta: "textScore" }, // Then by relevance
      })
      .skip(skip)
      .limit(limit)
      .populate("category")
      .populate("author");

    // find author name for each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    res.render("pages/SearchPage", {
      articles,
      searchQuery: query,
      categories: categories.data,
      user,
      tags: tagsResponse.data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
        hasNext: page < Math.ceil(totalArticles / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.redirect("/");
  }
});

export default router;
