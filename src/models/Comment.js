import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
    article: {
        type: Schema.Types.ObjectId, // Tham chiếu đến bài viết
        required: true
    },
    user: {
        type: Schema.Types.ObjectId, // Tham chiếu đến user
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Xóa chỉ mục duy nhất cho combination của article và user
CommentSchema.index({ article: 1, user: 1 }, { unique: false }); // Đảm bảo rằng không có chỉ mục duy nhất ở đây


const Comment = model('Comment', CommentSchema);

export default Comment;