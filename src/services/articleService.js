import { readFile } from "fs/promises";
import Article from "../models/Article.js";
import mongoose, { get } from "mongoose";
import moment from "moment";

export const incrementArticleViews = async (articleId) => {
  try {
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { views: 1 } }, // Increment the views field by 1
      { new: true } // Return the updated document
    );

    if (!updatedArticle) {
      return { error: "Article not found", status: 404 };
    }

    return { success: true, article: updatedArticle };
  } catch (error) {
    console.error("Error incrementing article views:", error);
    return { error: error.message, status: 500 };
  }
};

export const getArticles = async (sortBy = "publishedDate") => {
  try {
    let sortQuery = {};

    switch (sortBy) {
      case "title":
        sortQuery = { name: 1 }; // Sort by title alphabetically
        break;
      case "newest":
        sortQuery = { publishedDate: -1 }; // Newest first
        break;
      case "oldest":
        sortQuery = { publishedDate: 1 }; // Oldest first
        break;
      case "views":
        sortQuery = { views: -1 }; // Most viewed first
        break;
      default:
        sortQuery = { publishedDate: -1 }; // Default to newest
    }

    const response = await Article.find({ status: "published" })
      .populate("author")
      .populate("category")
      .sort(sortQuery)
      .lean()
      .exec();

    if (!response) {
      throw new Error("No articles found");
    }

    // Lọc bài viết dựa trên publishedAt
    const currentDate = new Date();
    const filteredArticles = response.filter((article) => {
      if (!article.publishedAt) return true;

      const cleanedPublishedAt = article.publishedAt
        .replace(" (GMT+7)", "")
        .replace(/^[^,]+,\s*/, "");

      const publishedDate = moment(
        cleanedPublishedAt,
        "DD/MM/YYYY, HH:mm"
      ).toDate();

      return publishedDate <= currentDate;
    });

    return {
      status: "SUCCESS",
      message: "Articles retrieved successfully",
      data: filteredArticles,
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

export const getMostViewedCategoryArticles = async () => {
  try {
    // First find highest viewed article for each category
    const mostViewedPerCategory = await Article.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$category",
          articleId: {
            $first: "$_id",
          },
          maxViews: { $max: "$views" },
          doc: {
            $first: "$$ROOT",
          },
        },
      },
      { $sort: { maxViews: -1 } },
    ]);

    // Get full article details with populated fields
    const articles = await Article.find({
      _id: {
        $in: mostViewedPerCategory.map((item) => item.articleId),
      },
    })
      .populate("author")
      .populate("category")
      .sort({ views: -1 })
      .lean()
      .exec();

    return {
      status: "SUCCESS",
      message: "Most viewed articles per category retrieved successfully",
      data: articles,
    };
  } catch (error) {
    console.error("getMostViewedCategoryArticles error:", error);
    return {
      status: "FAILED",
      message: error.message,
      data: null,
    };
  }
};

export const getArticlesById = async (id) => {
  try {
    const article = await Article.findOne({
      _id: id,
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

export const getArticlesByCategory = async (
  category,
  page = 1,
  limit = 12,
  status
) => {
  try {
    const skip = (page - 1) * limit;
    const filter = {
      category: { $in: [category] },
      status:
        status === "pending" || status === "published" ? "published" : status,
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
      status: 1,
      rejectReason: 1,
    };

    const [total, articles] = await Promise.all([
      Article.countDocuments(filter),
      Article.find(filter)
        .select(projection)
        .sort({ isPremium: -1, publishedDate: -1 }) // Sort by premium first, then by date
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    let filteredArticles;

    // Lọc bài viết dựa trên publishedAt
    if (status === "published" || status === "pending") {
      const currentDate = new Date();

      filteredArticles = articles.filter((article) => {
        if (!article.publishedAt) return true;

        const cleanedPublishedAt = article.publishedAt
          .replace(" (GMT+7)", "")
          .replace(/^[^,]+,\s*/, "");

        const publishedDate = moment(
          cleanedPublishedAt,
          "DD/MM/YYYY, HH:mm"
        ).toDate();

        if (status === "published") {
          return publishedDate <= currentDate;
        } else {
          return publishedDate > currentDate;
        }
      });
    }

    return {
      success: true,
      data:
        status === "published" || status === "pending"
          ? filteredArticles
          : articles,
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
        .sort({ isPremium: -1, publishedDate: -1 })
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

export const getArticleCountByAuthor = async (authorId, status) => {
  try {
    const count = await Article.countDocuments({
      author: authorId,
      status: status || "published",
    });

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

export const getArticlesByAuthor = async (authorId, page = 1, limit = 12) => {
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Article.countDocuments({ author: authorId });

    // Find articles with pagination
    const articles = await Article.find({ author: authorId })
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

export const getArticlesPublishedByAuthor = async (
  authorId,
  page = 1,
  limit = 12,
  status
) => {
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Article.countDocuments({
      author: authorId,
      status:
        status === "pending" || status === "published" ? "published" : status,
    });

    // Find articles with pagination
    const articles = await Article.find({
      author: authorId,
      status:
        status === "pending" || status === "published" ? "published" : status,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category")
      .populate("tags")
      .populate("author");

    let filteredArticles;

    // Lọc bài viết dựa trên publishedAt
    if (status === "published" || status === "pending") {
      const currentDate = new Date();

      filteredArticles = articles.filter((article) => {
        if (!article.publishedAt) return true;

        const cleanedPublishedAt = article.publishedAt
          .replace(" (GMT+7)", "")
          .replace(/^[^,]+,\s*/, "");

        const publishedDate = moment(
          cleanedPublishedAt,
          "DD/MM/YYYY, HH:mm"
        ).toDate();

        if (status === "published") {
          return publishedDate <= currentDate;
        } else {
          return publishedDate > currentDate;
        }
      });
    }

    return {
      success: true,
      data: {
        articles:
          status === "published" || status === "pending"
            ? filteredArticles
            : articles,
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

export const createArticle = async (data) => {
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
    createdAt: new Date(),
  };

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

export const createMultipleArticles = async (articles) => {
  const results = [];

  for (const article of articles) {
    const result = await createArticle(article);
    results.push(result);
  }

  return results;
};

export const importArticlesFromLocal = async () => {
  // Read the local articles.json file
  const data = await readFile("../crawler/updated_crawler-3.json", "utf8");
  const localArticles = JSON.parse(data);

  const results = await createMultipleArticles(localArticles);

  return results;
};

export const updateArticle = async (id, data) => {
  try {
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid ID format", status: 400 };
    }
    // Find the article by ID and update with the provided data
    const updatedArticle = await Article.updateOne({ _id: id }, data).exec();

    // Return the updated article or a not found message
    return updatedArticle || { error: "Article not found", status: 404 };
  } catch (error) {
    // Log the error and return a failure response
    console.error("Error updating article:", error);
    return { error: error.message, status: 500 };
  }
};

export const deleteArticle = async (id) => {
  try {
    // Kiểm tra xem id có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid ID format", status: 400 };
    }
    // Find the article by ID and delete it
    const deletedArticle = await Article.deleteOne({ _id: id }).exec();

    // Return the deleted article or a not found message
    return deletedArticle || { error: "Article not found", status: 404 };
  } catch (error) {
    // Log the error and return a failure response
    console.error("Error deleting article:", error);
    return { error: error.message, status: 500 };
  }
};

export function parsePublishedAt(publishedAt) {
  //Trả về publishedAt dạng new Date
  // Tách ngày tháng năm và giờ
  const regex =
    /(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{2}):(\d{2}) \((GMT[+-]\d{1,2})\)/;
  const match = publishedAt.match(regex);

  if (match) {
    const day = match[1];
    const month = match[2] - 1; // Lưu ý: tháng trong JavaScript bắt đầu từ 0
    const year = match[3];
    const hours = match[4];
    const minutes = match[5];

    // Tạo đối tượng Date
    const newDate = new Date(year, month, day, hours, minutes);

    // Điều chỉnh múi giờ nếu cần
    const gmtOffset = match[6]; // GMT+7 hoặc GMT-3,...
    const offset = parseInt(gmtOffset.replace("GMT", ""), 10);
    newDate.setHours(newDate.getHours() - offset);

    return newDate;
  } else {
    return null;
  }
}

export const getArticlesByPageWithSort = async (
  page = 1,
  limit = 12,
  sortBy = "publishedDate",
  sortOrder = -1
) => {
  try {
    // Tính toán skip dựa trên số trang và số bài viết mỗi trang
    const skip = (page - 1) * limit;

    // Truy vấn bài viết từ cơ sở dữ liệu
    const [total, articles] = await Promise.all([
      Article.countDocuments({ status: "published" }), // Đếm tổng số bài viết
      Article.find({ status: "published" }) // Tìm bài viết có trạng thái "published"
        .sort({ [sortBy]: sortOrder }) // Sắp xếp theo trường sortBy, mặc định publishedAt giảm dần
        .skip(skip) // Bỏ qua số bài viết dựa trên trang hiện tại
        .limit(limit) // Giới hạn số bài viết trên mỗi trang
        .lean() // Lấy dữ liệu dưới dạng plain JavaScript object
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
    console.error("getArticlesByPage error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  incrementArticleViews,
  getArticles,
  getArticlesById,
  getArticlesSameCategory,
  getArticlesByCategory,
  getArticlesByTag,
  getArticleCountByAuthor,
  getArticlesByAuthor,
  getArticlesPublishedByAuthor,
  createArticle,
  createMultipleArticles,
  importArticlesFromLocal,
  updateArticle,
  deleteArticle,
  parsePublishedAt,
  getArticlesByPageWithSort,
};
