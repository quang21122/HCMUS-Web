import express from "express";
import puppeteer from "puppeteer";
import {
  getArticlesById,
  getArticlesSameCategory,
  incrementArticleViews,
  getArticleCountByAuthor,
} from "../../services/articleService.js";
import {
  getCategoryName,
  getCategories,
} from "../../services/categoryService.js";
import { getTags, getTagName } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";
import { getCommentsByArticleId } from "../../services/commentService.js";

const router = express.Router();

router.get("/article/:id", async (req, res) => {
  try {
    const articleId = req.params.id;

    // Get article by ID
    const response = await getArticlesById(articleId);

    if (!response.success) {
      return res.status(404).send(response.error);
    }

    const article = response.data;

    if (article.status !== "published") {
      return res.status(404).send("Article not found");
    }

    // Check if article is premium and user is not authenticated
    if (article.isPremium) {
      if (!req.isAuthenticated()) {
        return res.render("pages/login", {
          error: "Bạn cần đăng nhập để xem bài viết premium",
          returnTo: `/article/${articleId}`,
        });
      }

      // Check if user has subscription
      if (!req.user) {
        return res.status(403).json({
          success: false,
          error: "Bạn cần đăng ký tài khoản Đọc giả để xem bài viết premium",
        });
      }
    }
    
    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    if (article.isPremium && user && user.role === "subscriber" && user.verified) {
      const minute = req.user.subscriptionExpiry;
      const subscriptionExpiry = new Date(req.user.createdAt).getTime() + minute * 60 * 1000;
      if (subscriptionExpiry < Date.now()) {
        return res.status(403).json({ success: false, error: "Hết hạn gói" });
      }
    }

    if (article.isPremium && req.user.role === "subscriber") {
      const minute = req.user.subscriptionExpiry;
      const subscriptionExpiry = new Date(req.user.createdAt).getTime() + minute * 60 * 1000;
      if (subscriptionExpiry < Date.now()) {
        return res.status(403).json({ success: false, error: "Hết hạn gói" });
      }
    }

    // Get category names
    const categoryNames = await Promise.all(
      article.category.map((catId) => getCategoryName(catId))
    );

    const tagsResponse = await getTags();

    // Get tag names
    const tagNames = await Promise.all(
      article.tags.map((tagId) => getTagName(tagId))
    );

    const relatedResponse = await getArticlesSameCategory(
      article.category[0],
      articleId
    );

    if (!relatedResponse.success) {
      return res
        .status(500)
        .json({ success: false, error: relatedResponse.error });
    }

    // Get author details
    const authors = await Promise.all(
      article.author.map((authorId) => findUser(authorId))
    );

    const articleCount = await Promise.all(
      article.author.map((authorId) => getArticleCountByAuthor(authorId))
    );

    const categories = await getCategories();
    const categoryData = await Promise.all(
      article.category.map(async (catId) => {
        const cat = categories.data.find(
          (c) => c._id.toString() === catId.toString()
        );
        if (!cat) return null;

        let parentName = null;
        if (cat.parent) {
          const parent = categories.data.find(
            (p) => p._id.toString() === cat.parent.toString()
          );
          if (parent) parentName = parent.name;
        }

        return {
          name: cat.name,
          parentName,
        };
      })
    );

    // Lấy danh sách comments bằng service
    const comments = await getCommentsByArticleId(articleId);
    console.log(comments)

    const articleData = {
      title: article.name,
      article: {
        ...article,
        categoryData,
        tagNames,
        authors,
        articleCount,
      },
      articleSameCategory: relatedResponse.data,
      tags: tagsResponse.data,
      user: user,
      categories: categories.data,
      comments: comments, // Thêm comments vào dữ liệu trả về
    };

    incrementArticleViews(articleId);

    res.render("pages/ArticlePage", articleData);
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/article/:id/download", async (req, res) => {
  let browser = null;
  try {
    const articleId = req.params.id;
    const article = await getArticlesById(articleId, "published");

    if (!article.success) {
      return res.status(404).send("Article not found");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Fix image paths in content
    let processedContent = article.data.content.replace(
      /src="\/uploads\//g,
      `src="${baseUrl}/uploads/`
    );

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Set content with proper image paths
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 10px auto;
            }
          </style>
        </head>
        <body>  
          <h1>${article.data.name}</h1>
          ${
            article.data.image
              ? `<img src="${
                  article.data.image.startsWith("/")
                    ? baseUrl + article.data.image
                    : article.data.image
                }" 
                  alt="${article.data.name}">`
              : ""
          }
          ${processedContent}
        </body>
      </html>
    `);

    // Wait for images with timeout
    await page.evaluate(async () => {
      const images = Array.from(document.getElementsByTagName("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve); // Don't fail on image error
            setTimeout(resolve, 5000); // Timeout after 5s
          });
        })
      );
    });

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    const safeFilename = article.data.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .substring(0, 50);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": buffer.length,
      "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
      "Cache-Control": "no-cache",
    });

    res.end(buffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  } finally {
    if (browser) await browser.close();
  }
});

export default router;
