import Article from "./models/Article.js";

export const getArticles = async () => {
  try {
    const articles = await Article.find().lean().maxTimeMS(30000).exec();

    return {
      success: true,
      data: articles,
    };
  } catch (error) {
    console.error("getAllArticles error:", error);
    return {
      success: false,
      error: error.message || "Error fetching articles",
    };
  }
};

export const getCategorizedArticles = async () => {
  try {
    const articles = await Article.find().lean().exec();

    // Group articles by parent category (first category)
    const categoryMap = new Map();

    articles.forEach((article) => {
      if (article.category && article.category.length > 0) {
        const parentCategory = article.category[0];
        const childCategories = article.category.slice(1);

        if (!categoryMap.has(parentCategory)) {
          categoryMap.set(parentCategory, new Set());
        }

        childCategories.forEach((child) => {
          if (child && child.trim()) {
            categoryMap.get(parentCategory).add(child);
          }
        });
      }
    });

    // Convert to array structure
    const categorizedData = Array.from(categoryMap).map(
      ([parent, children]) => ({
        parentCategory: parent,
        childCategories: Array.from(children),
      })
    );

    return {
      success: true,
      data: categorizedData,
    };
  } catch (error) {
    console.error("getCategorizedArticles error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getArticlesById = async (id) => {
  try {
    const article = await Article.findById(id).maxTimeMS(30000).lean().exec();

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
          _id: { $ne: currentArticleId },
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

    // Use projection to limit fields
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
      Article.countDocuments({ category: { $in: [category] } }),
      Article.find({ category: { $in: [category] } })
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