import { readFile } from 'fs/promises';
import Article from '../models/Article.js';
import mongoose from "mongoose";

export const incrementArticleViews = async (articleId) => {
  try {
      const updatedArticle = await Article.findByIdAndUpdate(
          articleId,
          { $inc: { views: 1 } }, // Increment the views field by 1
          { new: true } // Return the updated document
      );

      if (!updatedArticle) {
          return { error: 'Article not found', status: 404 };
      }

      return { success: true, article: updatedArticle };
  } catch (error) {
      console.error('Error incrementing article views:', error);
      return { error: error.message, status: 500 };
  }
};

export const getArticles = async () => {
  try {
    const response = await Article.find({ status: "published" })
      .populate("author")
      .populate("category")
      .sort({ publishedAt: -1 })
      .lean()
      .exec();

    if (!response) {
      throw new Error("No articles found");
    }

    return {
      status: "SUCCESS",
      message: "Articles retrieved successfully",
      data: response,
    };
  } catch (error) {
    console.error("getArticles error:", error);
    return {
      status: "FAILED",
      message: error.message || "An error occurred while retrieving articles",
      data: null,
    };
  }
};

export const getArticlesById = async (id) => {
  try {
    const article = await Article.findOne({
      _id: id,
      status: "published",
    })
      .maxTimeMS(30000)
      .lean()
      .exec();

    if (!article) {
      return {
        success: false,
        error: "Article not found",
      };
    }

    return {
      success: true,
      data: article,
    };
  } catch (error) {
    console.error("getArticles error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getArticlesSameCategory = async (category, currentArticleId) => {
  if (!category) {
    return { success: false, error: "Category parameter is required" };
  }

  try {
    const articles = await Article.aggregate([
      {
        $match: {
          category: { $in: [category] },
          _id: { $ne: new mongoose.Types.ObjectId(currentArticleId) },
          status: "published",
        },
      },
      { $sample: { size: 6 } },
      {
        $project: {
          name: 1,
          image: 1,
          publishedAt: 1,
        },
      },
    ]).exec();

    return {
      success: true,
      data: articles,
    };
  } catch (error) {
    console.error("getArticlesByCategory error:", error);
    return { success: false, error: error.message };
  }
};

export const getArticlesByCategory = async (category, page = 1, limit = 12) => {
  try {
    const skip = (page - 1) * limit;
    const filter = {
      category: { $in: [category] },
      status: "published",
    };

    const projection = {
      name: 1,
      image: 1,
      abstract: 1,
      content: 1,
      author: 1,
      publishedAt: 1,
      isPremium: 1,
      category: 1,
    };

    const [total, articles] = await Promise.all([
      Article.countDocuments(filter),
      Article.find(filter)
        .select(projection)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return {
      success: true,
      data: articles,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("getArticlesByCategory error:", error);
    return { success: false, error: error.message };
  }
};

export const getArticlesByTag = async (
  tag,
  page = 1,
  limit = 12,
  category = null
) => {
  try {
    const skip = (page - 1) * limit;

    // Build query based on whether category is provided
    const query = category
      ? {
          tags: { $in: [tag] },
          category: { $in: [category] },
          status: "published",
        }
      : {
          tags: { $in: [tag] },
          status: "published",
        };

    const projection = {
      name: 1,
      image: 1,
      abstract: 1,
      content: 1,
      author: 1,
      publishedAt: 1,
      isPremium: 1,
      category: 1,
    };

    // Run count and find in parallel
    const [total, articles] = await Promise.all([
      Article.countDocuments(query),
      Article.find(query)
        .select(projection)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return {
      success: true,
      data: articles,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("getArticlesByTag error:", error);
    return { success: false, error: error.message };
  }
};

export const getArticleCountByAuthor = async (authorId) => {
  try {
    const count = await Article.countDocuments({ author: authorId, status: "published" });

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error("getArticleCountByAuthor error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getArticlesPublishedByAuthor = async (authorId, page = 1, limit = 12) => {
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Article.countDocuments({ author: authorId, status: "published" });

    // Find articles with pagination
    const articles = await Article.find({ author: authorId, status: "published" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category")
      .populate("tags")
      .populate("author");

    return {
      success: true,
      data: {
        articles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
        },
      },
    };
  } catch (error) {
    console.error("getArticlesByAuthor error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const createArticle = async (data) => {
    const articleData = {
      name: data.name,
      image: data.image,
      abstract: data.abstract,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      isPremium: data.isPremium || false,
      status: data.status || "draft",
      publishedAt: data.publishedAt,
      author: data.author,
      editor: data.editor || "",
      views: data.views || 0,
      createdAt: new Date()
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
    const data = await readFile('../crawler/updated_crawler-3.json', 'utf8');
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

export default { incrementArticleViews, createArticle, createMultipleArticles, importArticlesFromLocal, getArticles, getArticlesById, getArticlesByCategory, getArticlesSameCategory, updateArticle, deleteArticle };