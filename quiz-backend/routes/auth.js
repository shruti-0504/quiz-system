const express = require("express");
const router = express.Router();
const sendEmail = require("../emailService");
const bcrypt = require("bcryptjs");
const User = require("../models/Users");

// Temporary storage for OTPs
const otpStore = {};

// Generate OTP function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// **1️⃣ Send OTP**
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Expires in 5 mins

    otpStore[email] = { otp, expiresAt };

    try {
        console.log(`✅ OTP for ${email}: ${otp}`);

        await sendEmail(email, "Your OTP Code", `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ error: "Error sending OTP" });
    }
});

// **2️⃣ Verify OTP & Register User**
router.post("/verify-otp", async (req, res) => {
    const { email, otp, name, password, role } = req.body;

    if (!otpStore[email]) {
        return res.status(400).json({ error: "OTP expired or not found" });
    }

    const { otp: storedOtp, expiresAt } = otpStore[email];

    if (Date.now() > expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: "OTP has expired" });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    delete otpStore[email];

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role });

        await user.save();
        console.log("✅ User registered:", user);

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("❌ Registration error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // Check user in DB (Assuming Mongoose User model)
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Login successful" });
});

module.exports = router;
