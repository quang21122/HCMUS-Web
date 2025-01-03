const fs = require("fs");

// Read categories.json and crawler-1.json
const categoriesFile = "categories.json";
const crawlerFile = "crawler-1.json";
const outputFile = "updated_crawler-1.json";

// Load and parse categories
const categoriesData = JSON.parse(fs.readFileSync(categoriesFile, "utf8"));
const categoryMap = {};

// Create a map of category names to _id
categoriesData.forEach((category) => {
  categoryMap[category.name] = category._id;
});

// Load and parse crawler data
const crawlerData = JSON.parse(fs.readFileSync(crawlerFile, "utf8"));

// Update crawler categories to use _id
crawlerData.forEach((item) => {
  if (item["Category"] && Array.isArray(item["Category"])) {
    item["Category"] = item["Category"].map(
      (category) => categoryMap[category] || category
    );
  }
});

// Write the updated crawler data to a new file
fs.writeFileSync(outputFile, JSON.stringify(crawlerData, null, 2), "utf8");
