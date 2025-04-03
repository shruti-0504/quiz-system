const express = require("express");
const User = require("../models/User"); // Import User model
const router = express.Router();

// Teacher updates student section
router.put("/teacher/update-section/:studentId", async (req, res) => {
    try {
        const { section } = req.body;

        const updatedStudent = await User.findByIdAndUpdate(
            req.params.studentId,
            { section },
            { new: true }
        );

        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ error: "Failed to update section" });
    }
});

module.exports = router; // Export router for use in the main app
