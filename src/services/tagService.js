import Tag from "../models/Tag.js";

export const getTags = async () => {
  try {
    const tags = await Tag.find().lean().maxTimeMS(30000).exec();

    return {
      success: true,
      data: tags,
    };
  } catch (error) {
    console.error("getTags error:", error);
    return {
      success: false,
      error: error.message || "Error fetching tags",
    };
  }
};

export const getTagName = async (tagId) => {
  try {
    // Use findOne with string ID
    const tag = await Tag.collection.findOne({ _id: tagId });

    if (!tag) {
      return "Unknown Tag";
    }

    return tag.name;
  } catch (error) {
    console.error("getTagName error:", error);
    return "Unknown Tag"; // Return default value instead of throwing
  }
};
