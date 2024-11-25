import express from "express";
import ejs from "ejs";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views"),
  path.join(__dirname, "public"),
]);

const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Add livereload to the middleware stack
app.use(connectLiveReload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

const getCategory = () => {
  const data = fs.readFileSync("crawler.json", "utf8");
  const articles = JSON.parse(data);

  const categories = new Set();

  articles.forEach((article) => {
    try {
      if (article.Category && article.Category.trim()) {
        // Chuẩn hóa chuỗi JSON
        let fixedCategory = article.Category.replace(/'/g, '"'); // Đổi nháy đơn thành nháy kép
        const categoryArray = JSON.parse(fixedCategory); // Parse JSON sau khi chuẩn hóa
        categoryArray.forEach((category) => {
          categories.add(category.trim());
        });
      }
    } catch (err) {
      console.error(`Error parsing category: ${article.Category}`, err);
    }
  });

  return Array.from(categories);
};

app.get("/", (req, res) => {
  const categories = getCategory();
  res.render("pages/HomePage", {
    title: "Trang chủ",
    categories,
  });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
