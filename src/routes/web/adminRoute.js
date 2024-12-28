import express from "express";
import { getCategories } from "../../services/categoryService.js";
import { getTags } from "../../services/tagService.js";
import userService from "../../services/userService.js";

const {findUser, getUsersByPage, searchUsersByPage} = userService;

const router = express.Router();

router.get("/manage-users/:currentTab/search", async (req, res) => {
    try {
        const currentTab = req.params.currentTab|| "ban-users";
        const page = parseInt(req.query.page) || 1;
        const searchUser = req.query.searchUser;
        let role;
        if (currentTab === "ban-users") {
            role = null;
        } else if (currentTab === "verify-editors") {
            role = "editor";
        } else if (currentTab === "extend-subscription") {
            role = "subscriber";
        }

        // Create timeout promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
        );

        // Run queries in parallel with timeout
        const result = await Promise.race([
            Promise.all([searchUsersByPage(page, searchUser, role), getCategories(), getTags()]),
            timeout,
        ]);

        if (!req.isAuthenticated()) {
            console.log("User not authenticated");
        }

        const userId = req.user?._id;
        const user = req.user || (userId && (await findUser(userId))) || null;

        const [usersResponse, categoriesResponse, tagsResponse] = result;

        const pageData = {
            title: "Quản lý người dùng",
            users: usersResponse.data,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
            pagination: usersResponse.pagination,
            user: user,
            currentTab: currentTab
        };
        res.render("pages/ManageUserPage", pageData);
    } catch (error) {
        console.error("ManageUser route error:", error);
        res.status(500).send("Server error");
    }
});


router.get("/manage-users/:currentTab", async (req, res) => {
    try {
        const currentTab = req.params.currentTab|| "ban-users";
        const page = parseInt(req.query.page) || 1;
        let role;
        if (currentTab === "ban-users") {
            role = null;
        } else if (currentTab === "verify-editors") {
            role = "editor";
        } else if (currentTab === "extend-subscription") {
            role = "subscriber";
        }

        // Create timeout promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
        );

        // Run queries in parallel with timeout
        const result = await Promise.race([
            Promise.all([getUsersByPage(page, role), getCategories(), getTags()]),
            timeout,
        ]);

        if (!req.isAuthenticated()) {
            console.log("User not authenticated");
        }

        const userId = req.user?._id;
        const user = req.user || (userId && (await findUser(userId))) || null;

        const [usersResponse, categoriesResponse, tagsResponse] = result;

        const pageData = {
            title: "Quản lý người dùng",
            users: usersResponse.data,
            categories: categoriesResponse.data,
            tags: tagsResponse.data,
            pagination: usersResponse.pagination,
            user: user,
            currentTab: currentTab
        };
        res.render("pages/ManageUserPage", pageData);
    } catch (error) {
        console.error("ManageUser route error:", error);
        res.status(500).send("Server error");
    }
});

export default router;