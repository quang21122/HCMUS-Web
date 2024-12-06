import Tag from '../models/Tag.js';

export const getTags = async () => {
    try {
        const tags = await Tag.find();
        return tags;
    } catch (error) {
        throw new Error(error);
    }
}
    
export const getTagName = async (tagId) => {
  try {
    // Use findOne with string ID
    const tag = await Tag.collection.findOne({ _id: tagId });

    if (!tag) {
      console.log(`No tag found with ID: ${tagId}`);
      return "Unknown Tag";
    }

    return tag.name;
  } catch (error) {
    console.error("getTagName error:", error);
    return "Unknown Tag"; // Return default value instead of throwing
  }
};