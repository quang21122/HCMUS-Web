import express from "express";
import cache from "../../config/cache.js";
import { getArticlesByCategory } from "../../services/articleService.js";
import {
  getCategories,
  findCategoryFamily,
} from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";

const router = express.Router();

router.get("/categories/:category", async (req, res) => {
  try {
    const categoryName = req.params.category;
    const parentName = req.query.p;
    const cacheKey = `category_${categoryName}_${parentName || "root"}`;

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

    // Find parent category if parentName provided
    let parentCategory = null;
    if (parentName) {
      parentCategory = categoriesResponse.data.find(
        (cat) => cat.name === parentName
      );
      if (!parentCategory) {
        return res.status(404).render("pages/404");
      }
    }

    // Find category with matching name and parent
    const category = categoriesResponse.data.find((cat) => {
      if (parentName) {
        return (
          cat.name === categoryName &&
          cat.parent?.toString() === parentCategory._id.toString()
        );
      }
      return cat.name === categoryName && !cat.parent;
    });

    if (!category) {
      return res.status(404).render("pages/404");
    }

    const categoryFamily = findCategoryFamily(
      categoriesResponse.data,
      category
    );

    // Get articles using category ID
    const articleResponse = await getArticlesByCategory(category._id);
    if (!articleResponse.success) {
      return res.status(500).json({ error: articleResponse.error });
    }

    console.log("articleResponse", articleResponse);

    const tagsResponse = await getTags();

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    // find author name for each article
    for (let i = 0; i < articleResponse.data.length; i++) {
      const article = articleResponse.data[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    const pageData = {
      title: categoryName,
      articles: articleResponse.data,
      categories: categoriesResponse.data,
      currentCategory: category._id,
      categoryFamily,
      pagination: articleResponse.pagination,
      tags: tagsResponse.data,
      user: user,
    };

    // Cache the result
    cache.set(cacheKey, pageData, 300);

    res.render("pages/CategoriesPage", pageData);
  } catch (error) {
    console.error("Category route error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
