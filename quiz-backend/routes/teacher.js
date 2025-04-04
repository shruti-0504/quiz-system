const express = require("express");
const User = require("../models/User"); // Import User model
const router = express.Router();

// Teacher updates student section
router.put("/update-section/:studentId", async (req, res) => {
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

router.post("/quiz/create", async (req, res) => {
  //Create a new quiz
});

router.get("/quizzes", async (req, res) => {
  //Get all quizzes created by teacher
});

router.put("/quiz/assign/:quizId", async (req, res) => {
  // Assign quiz to students
});

router.put("/quiz/password/:quizId", async (req, res) => {
  // Set password for a quiz
});

router.put("/quiz/starttime/:quizId", async (req, res) => {
  // Set starttime for a quiz
});

router.put("/quiz/endtime/:quizId", async (req, res) => {
  // Set endtime for a quiz
});

router.put("/quiz/duration/:quizId", async (req, res) => {
  // Set duration for a quiz
});

router.put("/quiz/section/:quizId", async (req, res) => {
  // Edit section
});

router.get("/results/:quizId", async (req, res) => {
  //View quiz results
});

router.put("/results/release/:quizId", async (req, res) => {
  // Allow students to see their results
});

router.get("/students/no-section", async (req, res) => {
  // Fetch students who have no assigned section
});

router.put("/students/assign-section/:studentId", async (req, res) => {
  // Assign section to a specific student
});
module.exports = router;
