const express = require("express");
const Course = require("../models/Course");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

module.exports = router;
