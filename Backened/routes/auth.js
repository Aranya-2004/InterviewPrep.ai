const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// ✅ SIGNUP
router.post("/signup", async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        email = email.toLowerCase().trim();

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email,
            password: hashed
        });

        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET missing");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("🔥 SIGNUP ERROR:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
});


// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        email = email.toLowerCase().trim();

        // ✅ FIXED: .select("+password") needed because schema has select:false
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "No account found with this email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET missing");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("🔥 LOGIN ERROR:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
});

module.exports = router;