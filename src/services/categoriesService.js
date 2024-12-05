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