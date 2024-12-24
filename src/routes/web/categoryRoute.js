import express from "express";
import cache from "../../config/cache.js";
import {
    getArticlesByCategory,
} from "../../services/articleService.js";
import { getCategories, findCategoryFamily } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";

const router = express.Router();

router.get("/categories/:category", async (req, res) => {
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

        const tagsResponse = await getTags();

        const userId = req.user?._id;
        const user = req.user || (userId && (await findUser(userId))) || null;

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