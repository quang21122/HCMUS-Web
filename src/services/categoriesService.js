import Category from "../models/Category.js";
import mongoose from "mongoose";
import { Types } from "mongoose";

export const getCategories = async () => {
  try {
    const categories = await Category.find().lean().maxTimeMS(30000).exec();

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("getAllCategories error:", error);
    return {
      success: false,
      error: error.message || "Error fetching categories",
    };
  }
};

export const getCategoryName = async (id) => {
  try {
    // Use raw query to avoid ObjectId casting
    const category = await Category.collection.findOne({ _id: id });

    if (!category) {
      console.log(`No category found with ID: ${id}`);
      return "Unknown Category";
    }

    return category.name;
  } catch (error) {
    console.error("Error getting category name:", error);
    return "Unknown Category";
  }
};

export const findCategoryFamily = (categories, targetCategory) => {
  try {
    if (!Array.isArray(categories) || !targetCategory) {
      console.log("Invalid input parameters");
      return [targetCategory];
    }

    // Find target category first
    const target = categories.find((cat) => cat._id === targetCategory._id);
    if (!target) {
      return [targetCategory];
    }

    if (target.parent === null) {
      // If target is parent, find all its children
      const children = categories.filter((cat) => cat.parent === target._id);
      return [target, ...children];
    } else {
      // If target is child, find its parent and siblings
      const parent = categories.find((cat) => cat._id === target.parent);
      const siblings = categories.filter((cat) => cat.parent === target.parent);
      return parent ? [parent, ...siblings] : [targetCategory];
    }
  } catch (error) {
    console.error("findCategoryFamily error:", error);
    return [targetCategory];
  }
};