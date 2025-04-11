const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const router = express.Router();
const bcrypt = require("bcrypt");
const StudentRegistration = require("../models/StudentRegistration");
const Quiz = require("../models/Quiz"); // Assuming you have a Quiz model
const StudentResponse = require("../models/StudentResponse"); // Adjust path as needed

//enroll student in a course
router.put("/update-courses", async (req, res) => {
  try {
    const { registrationNumber, courseCode } = req.body;

    const updatedStudent = await User.findOneAndUpdate(
      { registrationNumber },
      { $addToSet: { courses: courseCode } }, // prevent duplicates
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    await Course.findOneAndUpdate(
      { courseCode },
      { $addToSet: { studentRegNos: registrationNumber } }
    );

    res.json(updatedStudent);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update courses" });
  }
});

router.put("/remove-course", async (req, res) => {
  try {
    const { registrationNumber, courseCode } = req.body;

    const updatedStudent = await User.findOneAndUpdate(
      { registrationNumber },
      { $pull: { courses: courseCode } },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    await Course.findOneAndUpdate(
      { courseCode },
      { $pull: { studentRegNos: registrationNumber } }
    );

    res.json({ message: "Disenrolled successfully", updatedStudent });
  } catch (error) {
    console.error("Disenroll error:", error);
    res.status(500).json({ error: "Failed to disenroll from course" });
  }
});

router.get("/courses", async (req, res) => {
  const { registrationNumber } = req.query;

  try {
    // Step 1: Find the student by registration number
    const student = await User.findOne({ registrationNumber });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Step 2: Use course IDs or codes to get course details
    const enrolledCourses = await Course.find({
      courseCode: { $in: student.courses },
    });

    res.json({
      section: student.section,
      enrolledCourses, // send course objects
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).json({ error: "Failed to fetch enrolled courses" });
  }
});

router.get("/allcourses", async (req, res) => {
  try {
    const registrationNumber = req.query.registrationNumber;

    if (!registrationNumber) {
      return res.status(400).json({ error: "Registration number is required" });
    }

    const courses = await Course.find({
      studentRegNos: { $nin: [registrationNumber] },
    });

    res.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).json({ error: "Failed to fetch available courses" });
  }
});

// Assuming you have middleware to extract student from token/session

router.get("/quizzes", async (req, res) => {
  try {
    const { studentId, section } = req.query;
    const currentTime = new Date();

    // 1. Fetch all quizzes for the section within the valid time window
    const allQuizzes = await Quiz.find({
      section,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
    }).lean();

    // 2. Fetch all registrations for this student
    // 2. Fetch all registrations for this student (not filtering by approval)
    const registrations = await StudentRegistration.find({
      studentRegNo: studentId,
    })
      .select("quizTitle hasAttempted approvedByTeacher")
      .lean();

    const registrationMap = new Map();
    registrations.forEach((r) => {
      registrationMap.set(r.quizTitle, r.hasAttempted);
    });

    const finalQuizzes = allQuizzes.map((quiz) => {
      const registration = registrations.find(
        (r) => r.quizTitle === quiz.title
      );
      const isRegistered = Boolean(registration);
      const isAttempted = registration?.hasAttempted || false;
      const registrationStatus = registration
        ? registration.approvedByTeacher // "accepted", "pending", "rejected"
        : "not_registered";

      return {
        ...quiz,
        isRegistered,
        isAttempted,
        registrationStatus,
      };
    });

    res.json(finalQuizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

router.post("/verify-quiz/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const { password } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const isMatch = await bcrypt.compare(password, quiz.password);

    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    res.json({ success: true, message: "Password verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while verifying password" });
  }
});

router.get("/quiz/:quizId", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: "Error fetching quiz" });
  }
});
router.post("/submit-quiz/:quizId", async (req, res) => {
  const { answers, studentId } = req.body;
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const user = await User.findOne({ registrationNumber: studentId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔒 Check FIRST if already submitted
    const existingResponse = await StudentResponse.findOne({
      studentRegNo: studentId,
      quizTitle: quiz.title,
    });

    if (existingResponse) {
      return res.status(400).json({ message: "Quiz already submitted." });
    }

    // ✅ Calculate score and prepare answers
    let score = 0;
    const studentAnswers = quiz.questions.map((question, index) => {
      if (answers[index] === question.correctAnswer) score++;
      return {
        questionId: question._id,
        selectedOption: answers[index],
      };
    });

    // 🧠 Save to Quiz.studentScores
    quiz.studentScores.push({
      student: user._id,
      score,
    });
    await quiz.save();

    // 🧾 Save StudentResponse
    await StudentResponse.create({
      studentRegNo: studentId,
      quizTitle: quiz.title,
      answers: studentAnswers,
      score,
    });

    // ✅ Update hasAttempted flag
    // Step 1: Atomically lock the attempt
    const registration = await StudentRegistration.findOneAndUpdate(
      {
        studentRegNo: studentId,
        quizTitle: quiz.title,
        hasAttempted: false,
      },
      { hasAttempted: true },
      { new: true }
    );

    if (!registration) {
      return res
        .status(400)
        .json({ message: "Quiz already submitted or registration missing" });
    }

    res.json({
      success: true,
      message: "Quiz submitted successfully!",
      score,
      total: quiz.questions.length,
    });
  } catch (err) {
    console.error("Submit Quiz Error:", err);
    res.status(500).json({ message: "Error submitting quiz" });
  }
});

module.exports = router; // Export router for use in the main app
