import express from "express";

const router = express.Router();

router.post("/register-form", (req, res) => {
    const { step, role, formData } = req.body;

    if (step === 2) {
        // Store role in session
        req.session.role = role;
    } else if (step === 3) {
        // Store step 2 form data in session
        req.session.step2Data = formData;
    }

    // Store current step in session
    req.session.step = parseInt(step);

    // Redirect to render the next step
    res.redirect("/register-form");
});

router.get("/register-form", (req, res) => {
    const step = req.session.step || 1;
    const role = req.session.role || "";
    const step2Data = req.session.step2Data || {};

    res.render("pages/RegisterForm", {
        title: "Register Form",
        step,
        role,
        step2Data,
    });
});


router.post("/register", (req, res) => {
    const { penName } = req.body;
    const { userId, role, step2Data } = req.session;

    if (!role || !step2Data) {
        return res.status(400).send("Thiếu thông tin cần thiết.");
    }

    const { fullName, dob, phone, gender, country } = {
        ...step2Data,
    };

    // Nếu vai trò là author, bút danh là bắt buộc
    if (role === "author" && !penName) {
        return res.status(400).send("Bút danh là bắt buộc cho vai trò Phóng viên.");
    }
    const subscriptionExpiry = 10080;
    // Xử lý lưu dữ liệu vào cơ sở dữ liệu (giả lập)
    const user = {
        role,
        fullName,
        dob,
        phone,
        gender,
        country,
        penName: role === "author" ? penName : null,
        subscriptionExpiry: role === "subscriber" ? subscriptionExpiry : null,
    }

    fetch(`http://localhost:3000/api/users?_id=${userId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        }
    ).then((response) => {
        if (!response.ok) {
            throw new Error("Đăng ký thất bại.");
        }
    }).catch((error) => {
        console.error("Register error:", error);
        return res.status(500).send("Đăng ký thất bại.");
    });

    // Xóa session sau khi đăng ký
    req.session.destroy();

    res.status(200).send("Đăng ký thành công.");
});

export default router;