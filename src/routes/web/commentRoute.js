import express from "express";
import cache from "../../config/cache.js";
import { findUser } from "../../services/userService.js";
import Comment from "../../models/Comment.js";

const router = express.Router();

router.post("/comments", async (req, res) => {
  const { articleId, content } = req.body;
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const newComment = new Comment({
      content: req.body.content,
      user: userId,
      article: articleId,
      createdAt: new Date(),
    });

    await newComment.save();

    const user = req.user || (userId && (await findUser(userId))) || null;
    // Include user info in response
    const commentWithUser = {
      ...newComment.toObject(),
      user: {
        _id: user?._id,
        name: user?.name,
      },
    };

    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
