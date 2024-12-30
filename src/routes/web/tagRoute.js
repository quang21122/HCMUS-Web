// routes/renderRoutes.js
import express from "express";
import { getArticlesByTag } from "../../services/articleService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";
import Tag from "../../models/Tag.js";
import Article from "../../models/Article.js";
import { v4 as uuidv4 } from "uuid"; // Dùng thư viện uuid để tạo chuỗi ID ngẫu nhiên

const router = express.Router();

router.get("/tags/:tag", async (req, res) => {
  try {
    const tagName = decodeURIComponent(req.params.tag);
    const categoryName = req.query.category;
    const page = parseInt(req.query.page) || 1;

    const categoriesResponse = await getCategories();
    const category = categoriesResponse.data.find(
      (cat) => cat.name === categoryName
    );

    const tagsResponse = await getTags();
    const tag = tagsResponse.data.find((t) => t.name === tagName);

    const articlesResponse = await getArticlesByTag(
      tag._id,
      page,
      12,
      category
    );

    if (!articlesResponse.success) {
      return res.status(404).send(articlesResponse.error);
    }

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    // find author name for each article
    for (let i = 0; i < articlesResponse.data.length; i++) {
      const article = articlesResponse.data[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    const pageData = {
      title: category ? `#${tagName} - ${categoryName}` : `#${tagName}`,
      articles: articlesResponse.data,
      currentTag: tagName,
      currentCategory: categoryName,
      categories: categoriesResponse.data,
      tags: tagsResponse.data || [],
      pagination: articlesResponse.pagination,
      user: user,
    };

    res.render("pages/TagsPage", pageData);
  } catch (error) {
    console.error("Tags route error:", error);
    res.status(500).send("Server error");
  }
});

router.get("/manage-tags", async (req, res) => {
  try {
    // Fetch tất cả nhãn mà không phân trang
    const tags = await Tag.find().sort({ createdAt: -1 }); // Sắp xếp theo ngày tạo mới nhất

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;
    res.render("pages/ManageTagPage", {
      tags,
      currentPage: 1, // Không phân trang nên set thành 1
      totalPages: 1, // Vì tất cả nhãn được fetch, set totalPages là 1
      title: "Quản lý nhãn", // Tiêu đề trang
      user: user,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/manage-tags/addtag", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tên nhãn là bắt buộc." });
    }

    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ error: "Nhãn đã tồn tại." });
    }

    // Tạo _id là string (UUID hoặc chuỗi bạn muốn)
    const newTag = new Tag({
      _id: uuidv4(), // Sử dụng UUID để tạo _id dạng string
      name,
    });

    await newTag.save();

    res.status(201).json({ success: true, data: newTag });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/manage-tags/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID không hợp lệ." });
    }

    // Xóa nhãn trong collection "tags"
    const deletedTag = await Tag.findOneAndDelete({ _id: id });

    if (!deletedTag) {
      return res.status(404).json({ error: "Nhãn không tồn tại." });
    }

    // Xóa nhãn khỏi mảng `tags` trong collection "articles"
    const updatedArticles = await Article.updateMany(
      { tags: id }, // Điều kiện: bài viết chứa nhãn
      { $pull: { tags: id } } // Loại bỏ nhãn khỏi mảng `tags`
    );

    res.status(200).json({
      success: true,
      message: "Nhãn đã được xóa và cập nhật trong bài viết.",
      data: {
        deletedTag,
        updatedArticles: updatedArticles.modifiedCount, // Số bài viết được cập nhật
      },
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// API chỉnh sửa tên tag
router.put("/edit-tag/:id", async (req, res) => {
  const { id } = req.params; // Lấy id từ tham số URL
  const { name } = req.body; // Lấy tên tag mới từ body của yêu cầu

  try {
    // Tìm tag theo _id
    const tag = await Tag.findOne({ _id: id });

    // Nếu không tìm thấy tag
    if (!tag) {
      console.error("Tag không tồn tại với ID:", id);
      return res.status(404).json({ error: "Tag không tồn tại." });
    }

    // Cập nhật tên tag
    tag.name = name;

    // Lưu thay đổi
    await tag.save();

    // Trả về tag đã cập nhật
    res.status(200).json({ message: "Cập nhật tag thành công", data: tag });
  } catch (error) {
    console.error("Lỗi khi cập nhật tag:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật tag." });
  }
});

export default router;
