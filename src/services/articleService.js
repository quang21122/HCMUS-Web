import { readFile } from 'fs/promises';
import Article from '../models/Article.js';
import mongoose from "mongoose";


const readArticle = async (id) => {
    try {
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }
        // Find the article by ID
        const article = await Article
            .findById(id)
            .exec();
        
        // Return the article or a not found message
        return article || { error: "Article not found", status: 404 };
    }
    catch (error) {
        // Log the error and return a failure response
        console.error("Error reading article:", error);
        return { error: error.message, status: 500 };
    }
};

const createArticle = async (data) => {
    const articleData = {
        name: data["Title"],
        image: data["Top image"],
        abstract: data.Content.slice(0, 150), // First 150 characters as abstract
        content: data.Content,
        category: data["Category"], // Use category if available
        tags: data["List tag a"] || [], // Use tags if available, or an empty array
        isPremium: false, // Default value
        status: "draft", // Default status
        publishedAt: data["Date"], // Parse the provided date
        author: data.Author,
        editor: "", // Default to empty string as not provided
    }

    try {
        // Create a new article instance using the Article model
        const newArticle = new Article(articleData);

        // Save the article to the database
        const savedArticle = await newArticle.save();

        // Return the saved article or a success message
        return { success: true, article: savedArticle };
    } catch (error) {
        // Log the error and return a failure response
        console.error("Error creating article:", error);
        return { error: error.message, status: 500 };
    }
};

const createMultipleArticles = async (articles) => {
    const results = [];

    for (const article of articles) {
        const result = await createArticle(article);
        results.push(result);
    }

    return results;
}

const importArticlesFromLocal = async () => {
    // Read the local articles.json file
    const data = await readFile('../crawler/crawler.json', 'utf8');
    const localArticles = JSON.parse(data);

    const results = await createMultipleArticles(localArticles);

    return results;
}

const updateArticle = async (id, data) => {
    try {
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }
        // Find the article by ID and update with the provided data
        const updatedArticle = await Article
            .updateOne({ _id: id }, data)
            .exec();
        
        // Return the updated article or a not found message
        return updatedArticle || { error: "Article not found", status: 404 };
    }
    catch (error) {
        // Log the error and return a failure response
        console.error("Error updating article:", error);
        return { error: error.message, status: 500 };
    }
}

const deleteArticle = async (id) => {
    try {
        // Kiểm tra xem id có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { error: "Invalid ID format", status: 400 };
        }
        // Find the article by ID and delete it
        const deletedArticle = await Article
            .deleteOne({ _id: id })
            .exec();
        
        // Return the deleted article or a not found message
        return deletedArticle || { error: "Article not found", status: 404 };
    }
    catch (error) {
        // Log the error and return a failure response
        console.error("Error deleting article:", error);
        return { error: error.message, status: 500 };
    }
}

export default { createArticle, createMultipleArticles, importArticlesFromLocal, readArticle, updateArticle, deleteArticle };