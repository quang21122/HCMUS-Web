import fs from "fs";

export const getArticles = () => {
  const data = fs.readFileSync("crawler-1.json", "utf8");
  const articles = JSON.parse(data);

  const articleDetails = articles
    .map((article) => {
      try {
        // Lấy category và subcategories từ mảng Category
        const categories = Array.isArray(article.Category)
          ? article.Category
          : [];
        const category = categories[0] || null; // Phần tử đầu tiên
        const subcategories = categories.slice(1); // Các phần tử còn lại

        // Trả về chi tiết bài viết
        return {
          
          topImage: article["Top image"],
          title: article["Title"],
          author: article["Author"],
          date: article["Date"],
          content: article["Content"],
          category, // Danh mục chính
          subcategories, // Danh mục phụ
          tags: Array.isArray(article["List tag a"])
            ? article["List tag a"]
            : [], // List tag a
        };
      } catch (err) {
        console.error(`Error parsing article data: ${err}`);
        return null;
      }
    })
    .filter((article) => article !== null); // Lọc bỏ các bài viết bị lỗi

  return articleDetails;
};
