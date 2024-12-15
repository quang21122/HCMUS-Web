import express from 'express';
import articleController from '../../controllers/articleController.js';

const router = express.Router();

// Import articles
router.post("/import", articleController.importArticles);

// Create a new article
router.post("/", articleController.createArticle);

// Read a specific article by ID
router.get("/:id", articleController.readArticleById);

// Update a specific article by ID
router.put("/:id", articleController.updateArticleById);

// Delete a specific article by ID
router.delete("/:id", articleController.deleteArticleById);

export default router;