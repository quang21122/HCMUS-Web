import express from "express";

import { findUser } from "../../services/userService.js";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";

const router = express.Router();

router.get("/profile", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect("/auth/login");
        }

        const userId = req.user._id;

        const user = await findUser(userId);
        const categoriesResponse = await getCategories();
        const tagsResponse = await getTags();

        if (user.error) {
            return res.status(user.status).send(user.error);
        }

        const pageData = {
            title: "Profile",
            user,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
        };

        res.render("pages/ProfilePage", pageData);
    } catch (error) {
        console.error("Profile route error:", error);
        res.status(500).send("Server error");
    }
});

export default router;