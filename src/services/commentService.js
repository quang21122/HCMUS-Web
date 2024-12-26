import Comment from "../models/Comment.js";
import User from "../models/User.js";

export const getCommentsByArticleId = async (articleId) => {
  try {
    // Lấy danh sách bình luận
    const comments = await Comment.find({ article: articleId }).sort({ createdAt: -1 });

    // Duyệt qua danh sách bình luận để lấy thông tin người dùng
    const commentsWithUserDetails = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.user); // Tìm thông tin người dùng dựa trên ID
        return {
          ...comment.toObject(), // Chuyển đổi document Mongoose thành object
          user: user ? { _id: user._id, name: user.name } : null, // Ghép thông tin người dùng vào bình luận
        };
      })
    );

    return commentsWithUserDetails;
  } catch (error) {
    throw new Error("Không thể lấy bình luận và thông tin người dùng");
  }
};
