import express from "express";
import {
  getArticlesByCategory,
  getArticlesById,
  getArticleCountByAuthor,
} from "../../services/articleService.js";
import { findUser } from "../../services/userService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const status = req.query.status || "published";
    const page = parseInt(req.query.page) || 1;
    const limit = 12;

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    if (!user || !user.category) {
      return res.status(403).send("Unauthorized: No category assigned");
    }

    let articles;
    if (status === "published") {
      articles = await getArticlesByCategory(user.category, page, limit);
    } else if (status === "draft") {
      articles = await getArticlesByCategory(
        user.category,
        page,
        limit,
        "draft"
      );
    } else if (status === "rejected") {
      articles = await getArticlesByCategory(
        user.category,
        page,
        limit,
        "rejected"
      );
    }

    // Fix articles data access
    const articlesList = articles.data || [];

    // Add author names
    for (let i = 0; i < articlesList.length; i++) {
      const article = articlesList[i];
      if (article.author) {
        // Handle both single author and array of authors
        const authorIds = Array.isArray(article.author)
          ? article.author
          : [article.author];
        const authors = await Promise.all(
          authorIds.map((authorId) => findUser(authorId))
        );
        article.authorNames = authors.map(
          (author) => author?.name || "Unknown Author"
        );
      } else {
        article.authorNames = ["Unknown Author"];
      }
    }

    const categories = await getCategories();
    const tagsResponse = await getTags();

    const userCategory = categories.data.find(
      (cat) => cat._id.toString() === user.category.toString()
    );
    const categoryName = userCategory ? userCategory.name : "Unknown Category";

    return res.render("pages/EditorPage", {
      title: "Editor Dashboard",
      user,
      categoryName,
      articles: articlesList,
      pagination: articles.pagination,
      activeTab: status,
      tags: tagsResponse.data,
      categories: categories.data,
    });
  } catch (error) {
    console.error("Editor route error:", error);
    return res.status(500).render("error", { error: error.message });
  }
});

// Article review route
router.get("/article/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/auth/login");
    }
    const id = req.params.id;

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const categoriesResponse = await getCategories();
    const tagsResponse = await getTags();

    const articlesResponse = await getArticlesById(id, "draft");

    const categories = articlesResponse.data?.category || [];
    const tags = articlesResponse.data?.tags || [];

    const populatedCategories = categories
      .map((categoryId) =>
        categoriesResponse.data.find(
          (cat) => cat._id.toString() === categoryId.toString()
        )
      )
      .filter(Boolean);

    const populatedTags = tags
      .map((tagId) =>
        tagsResponse.data.find((tag) => tag._id.toString() === tagId.toString())
      )
      .filter(Boolean);

    // Get author details
    const authors = await Promise.all(
      articlesResponse.data.author.map((authorId) => findUser(authorId))
    );

    const articleCount = await Promise.all(
      articlesResponse.data.author.map((authorId) =>
        getArticleCountByAuthor(authorId)
      )
    );

    const article = {
      ...articlesResponse.data,
      categories: populatedCategories,
      tags: populatedTags,
      authors,
      articleCount,
    };

    console.log("Article", article);

    res.render("pages/DraftPage", {
      title: articlesResponse.data.name,
      user: user,
      categories: categoriesResponse.data,
      parentCategories: categoriesResponse.data.filter((cat) => !cat.parent),
      tags: tagsResponse.data,
      article: article,
    });
  } catch (error) {
    console.error("Editor route error:", error);
    return res.redirect("/500");
  }
});

export default router;
