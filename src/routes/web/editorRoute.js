import express from "express";
import {
  getArticlesByCategory,
  getArticlesById,
  getArticleCountByAuthor,
  getPendingArticlesByCategory,
  updateArticle,
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
      articles = await getArticlesByCategory(
        user.category,
        page,
        limit,
        "published"
      );
    } else if (status === "pending") {
      articles = await getArticlesByCategory(
        user.category,
        page,
        limit,
        "pending"
      );
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
    } else if (status === "pending") {
      articles = await getPendingArticlesByCategory(user.category, page, limit);
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

router.get("/articleReject/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const categoriesResponse = await getCategories();
    const tagsResponse = await getTags();
    const articlesResponse = await getArticlesById(id, "rejected"); // Changed to rejected status

    // Check if article exists and has required data
    if (!articlesResponse?.data) {
      throw new Error("Article not found");
    }

    const categories = articlesResponse.data?.category || [];
    const tags = articlesResponse.data?.tags || [];
    const authors = articlesResponse.data?.author || [];

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

    // Get author details with null check
    const authorDetails =
      authors.length > 0
        ? await Promise.all(authors.map((authorId) => findUser(authorId)))
        : [];

    const articleCount =
      authors.length > 0
        ? await Promise.all(
            authors.map((authorId) => getArticleCountByAuthor(authorId))
          )
        : [];

    const article = {
      ...articlesResponse.data,
      categories: populatedCategories,
      tags: populatedTags,
      authors: authorDetails,
      articleCount,
    };

    res.render("pages/RejectPage", {
      title: articlesResponse.data.name || "Rejected Article",
      user,
      categories: categoriesResponse.data,
      parentCategories: categoriesResponse.data.filter((cat) => !cat.parent),
      tags: tagsResponse.data,
      article,
    });
  } catch (error) {
    console.error("Editor route error:", error);
    return res.redirect("/500");
  }
});

router.post("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Update article status and add reject info
    const result = await updateArticle(id, {
      status: "rejected",
      rejectReason: reason,
    });

    if (!result) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article rejected successfully" });
  } catch (error) {
    console.error("Error rejecting article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, categories, scheduleDate } = req.body;

    const publishDate = new Date(scheduleDate);
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const formattedDate = `${days[publishDate.getDay()]}, ${String(
      publishDate.getDate()
    ).padStart(2, "0")}/${String(publishDate.getMonth() + 1).padStart(
      2,
      "0"
    )}/${publishDate.getFullYear()}, ${String(publishDate.getHours()).padStart(
      2,
      "0"
    )}:${String(publishDate.getMinutes()).padStart(2, "0")} (GMT+7)`;

    const result = await updateArticle(id, {
      status: "published",
      tags: tags,
      category: categories,
      publishedDate: publishDate,
      publishedAt: formattedDate,
    });

    if (!result) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article approved successfully" });
  } catch (error) {
    console.error("Error approving article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
