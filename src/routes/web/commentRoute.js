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

    // Lưu bình luận vào cơ sở dữ liệu
    await newComment.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
