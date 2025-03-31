const express = require("express");
const router = express.Router();
const sendEmail = require("../emailService"); // Import email function
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Temporary storage for OTPs (Consider using Redis for production)
const otpStore = {};

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// **1️⃣ Route to Send OTP**
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes

    otpStore[email] = { otp, expiresAt }; // Store OTP with expiry time

    try {
        await sendEmail(
            email,
            "Your OTP Code",
            `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
        );
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Error sending OTP" });
    }
});

// **2️⃣ Route to Verify OTP**
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!otpStore[email]) {
        return res.status(400).json({ error: "OTP expired or not found" });
    }

    const { otp: storedOtp, expiresAt } = otpStore[email];

    if (Date.now() > expiresAt) {
        delete otpStore[email]; // Remove expired OTP
        return res.status(400).json({ error: "OTP has expired" });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    delete otpStore[email]; // OTP verified, remove from storage
    res.status(200).json({ message: "OTP verified successfully" });
});

module.exports = router;
