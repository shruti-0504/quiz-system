const express = require("express");
const User = require("../models/User"); // Import User model
const router = express.Router();

// Student updates their courses
router.put("/student/update-courses", authMiddleware, async (req, res) => {
    try {
        const { courses } = req.body;

        const updatedStudent = await User.findByIdAndUpdate(
            req.user.id, // Assuming authentication middleware sets req.user
            { courses },
            { new: true }
        );

        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ error: "Failed to update courses" });
    }
});

module.exports = router; // Export router for use in the main app
