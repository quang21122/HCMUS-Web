// routes/renderRoutes.js

import express from 'express';
import {
    getArticlesByTag,
} from "../../services/articleService.js";
import {
    getCategories,
} from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from '../../services/userService.js';
import cache from '../../config/cache.js';

const router = express.Router();

router.get("/tags/:tag", async (req, res) => {
    try {
      const tagName = decodeURIComponent(req.params.tag);
      const categoryName = req.query.category;
      const page = parseInt(req.query.page) || 1;
      const cacheKey = `tag_${tagName}_category_${categoryName}_page_${page}`;

      // Check cache
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.render("pages/TagsPage", cachedData);
      }

      const categoriesResponse = await getCategories();

      const category = categoriesResponse.data.find(
        (cat) => cat.name === categoryName
      );

      const tagsResponse = await getTags();
      const tag = tagsResponse.data.find((t) => t.name === tagName);

      const articlesResponse = await getArticlesByTag(
        tag._id,
        page,
        12,
        category
      );

      if (!articlesResponse.success) {
        return res.status(404).send(articlesResponse.error);
      }

      const userId = req.user?._id;
      const user = req.user || (userId && (await findUser(userId))) || null;

      // find author name for each article
      for (let i = 0; i < articlesResponse.data.length; i++) {
        const article = articlesResponse.data[i];
        const authors = await Promise.all(
          article.author.map((author) => findUser(author))
        );
        article.authorNames = authors.map((author) => author.name);
      }

      const pageData = {
        title: category ? `#${tagName} - ${categoryName}` : `#${tagName}`,
        articles: articlesResponse.data,
        currentTag: tagName,
        currentCategory: categoryName,
        categories: categoriesResponse.data,
        tags: tagsResponse.data || [],
        pagination: articlesResponse.pagination,
        user: user,
      };

      // Cache the result
      cache.set(cacheKey, pageData);

      res.render("pages/TagsPage", pageData);
    } catch (error) {
        console.error("Tags route error:", error);
        res.status(500).send("Server error");
    }
});

export default router;
