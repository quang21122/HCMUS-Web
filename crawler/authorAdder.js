import { connectDB } from '../src/config/db.js';
import Article from '../src/models/Article.js';
import User from '../src/models/User.js';

const userData = {
    name: "",
    role: "author",
    email: "",
    password: "",
    ban: false,
    dob: "",
    createdAt: new Date(),
    subscriptionExpiry: null,
    penName: "",
    category: "",
    googleID: "",
    gender: "",
    country: "",
    fullName: "",
    phone: ""
};
var authorNames = [];

async function addAuthorToArray() {
    try {
        // Get all articles
        const articles = await Article.find().lean().exec();

        // Process each article
        articles.forEach((article) => {
            if (article.author && article.author.includes('(')) {
                article.author = article.author.split('(')[0].trim();
            }

            if (article.author && article.author.includes('-')) {
                const authors = article.author.split('-').map(author => author.trim());
                authors.forEach(author => {
                    if (!authorNames.includes(author)) {
                        authorNames.push(author);
                    }
                });
            } else if (!authorNames.includes(article.author)) {
                authorNames.push(article.author);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

async function addAuthors() {
    try {
        await Promise.all(authorNames.map(async (authorName) => {
            // Create a new user instance using the User model
            const newUser = new User(userData);
            newUser.name = authorName;
            newUser.email = authorName.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/\s+/g, '')
                + "@gmail.com";
            newUser.password = "123";
            newUser.penName = authorName;
            newUser.category = "";
            newUser.gender = "";
            newUser.country = "VN";
            newUser.fullName = authorName;
            newUser.phone = "123456789";

            // Save the user to the database
            const savedUser = await newUser.save();

            // Return the saved user or a success message
            return { success: true, user: savedUser };
        }));
    } catch (error) {
        console.error('Error:', error);
    }
}

async function addAuthorsToArticles() {
    try {
        // Get all articles
        const articles = await Article.find().lean().exec();

        // Process each article
        await Promise.all(articles.map(async (article) => {
            if (article.author && article.author.includes('-')) {
                const authors = article.author.split('-').map(author => author.trim());
                const authorIds = await Promise.all(authors.map(async (author) => {
                    const user = await User.findOne({ name: author }).lean().exec();
                    return user._id.toString();
                }));
                article.author = authorIds;
            } else if (article.author) {
                // remove (...)
                if (article.author.includes('(')) {
                    article.author = article.author.split('(')[0].trim();
                }

                const user = await User.findOne({ name: article.author }).lean().exec();
                if (user) {
                    article.author = user._id.toString();
                }
            }

            return Article.updateOne({ _id: article._id }, { $set: { author: article.author } });
        })); 
    } catch (error) {
        console.error('Error:', error);
    }
}