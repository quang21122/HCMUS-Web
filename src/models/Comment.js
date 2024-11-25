import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        auto: true,
        required: true, 
        unique: true
    },
    article: {
        type: String,
        required: true
    },
    user: {
        type: String,
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

const Comment = model('Comment', CommentSchema);

export default Comment;