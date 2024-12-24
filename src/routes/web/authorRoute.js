import express from "express";
import { getArticlesByAuthor } from "../../services/articleService.js";
import { getTags } from "../../services/tagService.js";
import { getCategories } from "../../services/categoryService.js";
import { findUserByName, findUser } from "../../services/userService.js";
import cache from "../../config/cache.js";

const router = express.Router();

router.get("/author/:author", async (req, res) => {
  try {
    const author = req.params.author;
    const page = parseInt(req.query.page) || 1;

    // Find user by name
    const userResponse = await findUserByName(author);
    if (!userResponse.success) {
      return res.status(404).render("pages/404");
    }

    // Get articles by author
    const articlesResponse = await getArticlesByAuthor(
      userResponse.data._id,
      page
    );

    if (!articlesResponse.success) {
      return res.status(500).json({ error: articlesResponse.error });
    }

    // Get all tags
    const tagsResponse = await getTags();

    // Get all categories
    const categoriesResponse = await getCategories();

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    const pageData = {
      title: `Kí giả - ${author}`,
      author: userResponse.data,
      articles: articlesResponse.data.articles,
      tags: tagsResponse.data,
      categories: categoriesResponse.data,
      pagination: articlesResponse.data.pagination,
      user: user,
    };

    res.render("pages/AuthorPage", pageData);
  } catch (error) {
    console.error("Author page error:", error);
  }
});

export default router;
