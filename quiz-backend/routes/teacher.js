const express = require("express");
const User = require("../models/User");
const Quiz = require("../models/Quiz"); // Assuming you have a Quiz model
const Result = require("../models/StudentResponse"); // Assuming you have a Result model
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

// Create a new quiz// Create a new quiz
router.post("/quiz/create", async (req, res) => {
  try {
    const {
      title,
      course,
      section,
      teacherRegNo,
      password,
      duration,
      startTime,
      endTime,
      RegStartTime,      
      RegEndTime,  
      questions,
    } = req.body;

    // Basic validation
    if (
      !title ||
      !course ||
      !section ||
      !teacherRegNo ||
      !password ||
      !duration ||
      !startTime ||
      !endTime ||
      !RegStartTime ||
      !RegEndTime ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    for (const question of questions) {
      if (
        !question.questionText ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        question.options.some((opt) => !opt.trim())
      ) {
        return res.status(400).json({
          message: "Each question must have text and 4 non-empty options.",
        });
      }

      if (
        typeof question.correctAnswer !== "number" ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3
      ) {
        return res
          .status(400)
          .json({ message: "Each question must have a valid correct answer." });
      }
    }

    // Save quiz
    const newQuiz = new Quiz({
      title,
      course,
      section,
      teacherRegNo,
      password,
      duration,
      startTime,
      endTime,
      RegStartTime,
      RegEndTime,
      questions,
    });

    await newQuiz.save();
    res
      .status(201)
      .json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (error) {
    console.error("Quiz creation failed:", error);
    res.status(500).json({ message: "Server error while creating quiz." });
  }
});

// Get all quizzes created by teacher
router.get("/quizzes", async (req, res) => {
  try {
    const { teacherId } = req.query;
    const quizzes = await Quiz.find({ createdBy: teacherId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

// Assign quiz to students
router.put("/quiz/assign/:quizId", async (req, res) => {
  try {
    const { studentIds } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { $addToSet: { assignedTo: { $each: studentIds } } },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign quiz" });
  }
});

// Set password for a quiz
router.put("/quiz/password/:quizId", async (req, res) => {
  try {
    const { password } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { password },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to set password" });
  }
});

// Set start time for a quiz
router.put("/quiz/starttime/:quizId", async (req, res) => {
  try {
    const { startTime } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { startTime },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to set start time" });
  }
});

// Set end time for a quiz
router.put("/quiz/endtime/:quizId", async (req, res) => {
  try {
    const { endTime } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { endTime },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to set end time" });
  }
});

// Set duration for a quiz
router.put("/quiz/duration/:quizId", async (req, res) => {
  try {
    const { duration } = req.body; // in minutes
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { duration },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to set duration" });
  }
});

// Edit section for a quiz
router.put("/quiz/section/:quizId", async (req, res) => {
  try {
    const { section } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { section },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to update section" });
  }
});

// View quiz results
router.get("/results/:quizId", async (req, res) => {
  try {
    const results = await Result.find({ quizId: req.params.quizId })
      .populate("studentId", "email name")
      .populate("quizId", "title");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Allow students to see their results
router.put("/results/release/:quizId", async (req, res) => {
  try {
    const { release } = req.body; // boolean
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { resultsReleased: release },
      { new: true }
    );
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to update results release status" });
  }
});

// Fetch students who have no assigned section
router.get("/students/no-section", async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      section: { $in: [null, ""] },
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Assign section to a specific student
router.put("/students/assign-section/:studentId", async (req, res) => {
  try {
    const { section } = req.body;
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.studentId,
      { section },
      { new: true }
    );
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign section" });
  }
});

module.exports = router;
