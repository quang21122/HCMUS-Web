import express from "express";
import ejs from "ejs";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import path from "path";
import { fileURLToPath } from "url";
import { getArticles } from "./getArticles.js";

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

// Connect to the database
createDb();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Add livereload to the middleware stack
app.use(connectLiveReload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

app.get("/", (req, res) => {
  const articles = getArticles();
  const categories = [
    ...new Set(articles.flatMap((article) => article.categories)),
  ];

  res.render("pages/HomePage", {
    title: "Trang chủ",
    categories,
    articles,
  });

app.use(express.static('public'));
app.use(express.json());

app.use('/api/articles', articleRoute);
app.use('/api/users', userRoute);


// Render the index page
app.get('/', (req, res) => {
  const data = {
    title: 'SSR Web',
    message: 'This is a dynamic message from the server'
  };
  res.render('index', data);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
