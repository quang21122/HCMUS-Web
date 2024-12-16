import { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ArticleSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    abstract: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: [String] },
    tags: { type: [String] },
    isPremium: { type: Boolean, required: true },
    status: { type: String, required: true },
    publishedAt: { type: String },
    author: { type: [String] },
    editor: { type: String },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
});

const Article = model('articles', ArticleSchema);

export default Article;