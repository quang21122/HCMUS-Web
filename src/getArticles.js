// getArticles.js
import fs from "fs";

export const getArticles = () => {
  const data = fs.readFileSync("crawler.json", "utf8");
  const articles = JSON.parse(data);

  const articleDetails = articles
    .map((article) => {
      try {
        // Ensure the 'Category' field is parsed correctly
        let categories = [];
        if (article.Category && article.Category.trim()) {
          let fixedCategory = article.Category.replace(/'/g, '"');
          categories = JSON.parse(fixedCategory); // Parse the JSON string
        }

        // Xử lý danh sách tags
        let tags = [];
        if (article["List tag a"] && Array.isArray(article["List tag a"])) {
          tags = article["List tag a"]
            .map((tagString) => {
              let fixedTagString = tagString.replace(/'/g, '"');
              try {
                return JSON.parse(fixedTagString); // Parse chuỗi thành mảng [tag, url]
              } catch (err) {
                console.error(`Error parsing tag string: ${tagString}`);
                return null;
              }
            })
            .filter((tag) => tag !== null); // Lọc bỏ các tag bị lỗi
        }

        // Trả về chi tiết bài viết
        return {
          topImage: article["Top image"],
          title: article["Title"],
          author: article["Author"],
          date: article["Date"],
          content: article["Content"],
          categories: categories,
          tags: tags, // Trả về danh sách tags đã xử lý
        };
      } catch (err) {
        console.error(`Error parsing article data: ${err}`);
        return null;
      }
    })
    .filter((article) => article !== null); // Lọc bỏ các bài viết bị lỗi

  return articleDetails;
};
