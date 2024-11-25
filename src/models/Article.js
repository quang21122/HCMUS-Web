import { Schema, model } from 'mongoose';

const ArticleSchema = new Schema({
    id: { type: String, required: true, unique: true, auto: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    abstract: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], required: true },
    isPremium: { type: Boolean, required: true },
    status: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    author: { type: String, required: true },
    editor: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Article = model('Article', ArticleSchema);

export default Article;