import express from "express";
import { getArticlesByAuthor } from "../../services/articleService.js";
import { getTags } from "../../services/tagService.js";
import { findUserByName } from "../../services/userService.js";
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

    const pageData = {
      title: `Kí giả - ${author}`,
      author: userResponse.data,
      articles: articlesResponse.data.articles,
      tags: tagsResponse.data,
      pagination: articlesResponse.data.pagination,
    };

    res.render("pages/AuthorPage", pageData);
  } catch (error) {
    console.error("Author page error:", error);
  }
});

export default router;
