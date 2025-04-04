const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const router = express.Router();

// Student updates their courses
router.put("/update-courses", async (req, res) => {
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

router.put("/enroll", async (req, res) => {
  //Enroll student in a course
});

router.get("/courses", async (req, res) => {
  //Get student’s enrolled courses
});

router.get("/allcourses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/quizzes", async (req, res) => {
  //List quizzes student can attempt
});

router.post("/verify-quiz/:quizId", async (req, res) => {
  //Check if password is correct
});

router.get("/quiz/:quizId", async (req, res) => {
  //Get questions for a quiz
});

router.post("/submit-quiz/:quizId", async (req, res) => {
  //Submit quiz answers
});

module.exports = router; // Export router for use in the main app
