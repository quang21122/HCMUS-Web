import Article from "./models/Article.js";

export const getArticles1 = async (id) => {
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
