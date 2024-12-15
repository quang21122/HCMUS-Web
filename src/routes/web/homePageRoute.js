import express from "express";
import cache from "../../config/cache.js";
import { getArticles } from "../../services/articleService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";

const router = express.Router();

router.get("/", async (req, res) => {
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
            Promise.all([getArticles(), getCategories(), getTags()]),
            timeout,
        ]);

        const [articlesResponse, categoriesResponse, tagsResponse] = result;

        if (!articlesResponse.success || !categoriesResponse.success) {
            throw new Error("Failed to fetch data");
        }

        const pageData = {
            title: "Trang chủ",
            articles: articlesResponse.data,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
        };

        // Cache the result
        cache.set(cacheKey, pageData);

        res.render("pages/HomePage", pageData);
    } catch (error) {
        console.error("Home route error:", error);
        res.status(500).send("Server error");
    }
});

export default router;
