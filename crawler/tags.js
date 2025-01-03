const fs = require("fs");

// Read the files
const tags = JSON.parse(fs.readFileSync("./tags.json", "utf8"));
const articles = JSON.parse(
  fs.readFileSync("./updated_crawler-1.json", "utf8")
);

// Create a map of tag names to tag IDs
const tagMap = {};
tags.forEach((tag) => {
  tagMap[tag.name] = tag._id;
});

// Update the tags in articles to use IDs
articles.forEach((article) => {
  if (article["List tag a"]) {
    article["List tag a"] = article["List tag a"].map(
      (tagName) => tagMap[tagName]
    );
  }
});

// Write the updated articles back to file
fs.writeFileSync("./updated_crawler-2.json", JSON.stringify(articles, null, 2));
