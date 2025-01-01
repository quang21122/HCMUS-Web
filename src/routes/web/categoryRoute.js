import express from "express";
import cache from "../../config/cache.js";
import { getArticlesByCategory } from "../../services/articleService.js";
import {
  getCategories,
  findCategoryFamily,
} from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import { findUser } from "../../services/userService.js";
import Category from '../../models/Category.js';
import Tag from "../../models/Tag.js";
import Article from "../../models/Article.js";
import { v4 as uuidv4 } from "uuid"; // Dùng thư viện uuid để tạo chuỗi ID ngẫu nhiên

const router = express.Router();

router.get("/categories/:category", async (req, res) => {
  try {
    const categoryName = req.params.category;
    const parentName = req.query.p;
    const cacheKey = `category_${categoryName}_${parentName || "root"}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.render("pages/CategoriesPage", cachedData);
    }

    // Get all categories first
    const categoriesResponse = await getCategories();
    if (!categoriesResponse.success) {
      return res.status(500).json({ error: categoriesResponse.error });
    }

    // Find parent category if parentName provided
    let parentCategory = null;
    if (parentName) {
      parentCategory = categoriesResponse.data.find(
        (cat) => cat.name === parentName
      );
      if (!parentCategory) {
        return res.status(404).render("pages/404");
      }
    }

    // Find category with matching name and parent
    const category = categoriesResponse.data.find((cat) => {
      if (parentName) {
        return (
          cat.name === categoryName &&
          cat.parent?.toString() === parentCategory._id.toString()
        );
      }
      return cat.name === categoryName && !cat.parent;
    });

    if (!category) {
      return res.status(404).render("pages/404");
    }

    const categoryFamily = findCategoryFamily(
      categoriesResponse.data,
      category
    );

    // Get articles using category ID
    const articleResponse = await getArticlesByCategory(category._id);
    if (!articleResponse.success) {
      return res.status(500).json({ error: articleResponse.error });
    }

    const tagsResponse = await getTags();

    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;

    // find author name for each article
    for (let i = 0; i < articleResponse.data.length; i++) {
      const article = articleResponse.data[i];
      const authors = await Promise.all(
        article.author.map((author) => findUser(author))
      );
      article.authorNames = authors.map((author) => author.name);
    }

    const pageData = {
      title: categoryName,
      articles: articleResponse.data,
      categories: categoriesResponse.data,
      currentCategory: category._id,
      categoryFamily,
      pagination: articleResponse.pagination,
      tags: tagsResponse.data,
      user: user,
    };

    // Cache the result
    cache.set(cacheKey, pageData, 300);

    res.render("pages/CategoriesPage", pageData);
  } catch (error) {
    console.error("Category route error:", error);
    res.status(500).send("Server error");
  }
});

// Get all categories
router.get('/manage-categories', async (req, res) => {
  try {
    const categories = await Category.find();
    const tags = await Tag.find();
    const userId = req.user?._id;
    const user = req.user || (userId && (await findUser(userId))) || null;
    // Group categories by parent
    const groupedCategories = categories.reduce((acc, category) => {
      if (!category.parent || category.parent.length === 0) {
        // This is a main category
        acc[category._id] = {
          ...category.toObject(),
          subCategories: []
        };
      }
      return acc;
    }, {});

    // Add subcategories
    categories.forEach(category => {
      if (category.parent && category.parent.length > 0) {
        category.parent.forEach(parentId => {
          if (groupedCategories[parentId]) {
            groupedCategories[parentId].subCategories.push(category);
          }
        });
      }
    });

    res.render('pages/ManageCategoryPage', {
      categories: Object.values(groupedCategories),
      title: 'Quản lý chuyên mục', 
      tags,
      user : user,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add new category
router.post('/manage-categories/addcategory', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const newCategory = new Category({ 
      _id: uuidv4(), // Sử dụng UUID để tạo _id dạng string
      name,
      parent : null,
    });
    
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add subcategory
router.post('/api/categories/:id/subcategories', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const newSubCategory = new Category({
      _id: uuidv4(), // Sử dụng UUID để tạo _id dạng string
      name,
      parent: [id]
    });

    await newSubCategory.save();
    res.status(201).json(newSubCategory);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete category
router.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Update articles to set category to "Other"
    const otherCategory = await Category.findOne({ name: 'Other' }); // Tìm category có tên là "Other"
    if (!otherCategory) {
      // Nếu không có category "Other", bạn cần tạo nó
      const newCategory = new Category({ name: 'Other' });
      await newCategory.save();
    }

    // Cập nhật các bài viết có category là category bị xóa thành "Other"
    await Article.updateMany({ category: id }, { category: otherCategory._id });

    // Xóa category và các subcategories
    await Category.deleteMany({ $or: [{ _id: id }, { parent: id }] });

    res.status(200).json({ message: 'Category and related articles updated and category deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete subcategory
router.delete('/api/categories/:categoryId/subcategories/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    
    // Cập nhật các bài viết, loại bỏ subcategoryId khỏi mảng category
    await Article.updateMany(
      { category: subcategoryId },  // Tìm các bài viết có chứa subcategoryId này
      { $pull: { category: subcategoryId } }  // Loại bỏ subcategoryId khỏi mảng category
    );
    
    // Xóa subcategory
    await Category.findByIdAndDelete(subcategoryId);
    
    res.status(200).json({ message: 'Subcategory deleted and related articles updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API chỉnh sửa tên category
router.put("/edit-category/:id", async (req, res) => {
  const { id } = req.params; // Lấy id từ tham số URL
  const { name } = req.body; // Lấy tên category mới từ body của yêu cầu

  try {
    // Tìm category theo _id
    const category = await Category.findOne({ _id: id });

    // Nếu không tìm thấy category
    if (!category) {
      console.error("Tag không tồn tại với ID:", id);
      return res.status(404).json({ error: "Tag không tồn tại." });
    }

    // Cập nhật tên category
    category.name = name;

    // Lưu thay đổi
    await category.save();

    // Trả về category đã cập nhật
    res.status(200).json({ message: "Cập nhật category thành công", data: category });
  } catch (error) {
    console.error("Lỗi khi cập nhật category:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật category." });
  }
});

export default router;
