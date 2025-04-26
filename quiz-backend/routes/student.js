const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const router = express.Router();
const bcrypt = require("bcrypt");
const StudentRegistration = require("../models/StudentRegistration");
const Quiz = require("../models/quiz"); // Assuming you have a Quiz model
const StudentResponse = require("../models/StudentResponse"); // Adjust path as needed

router.put("/courses", async (req, res) => {
  try {
    const { registrationNumber, courseCode, action } = req.body;

    if (!registrationNumber || !courseCode || !action) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const student = await User.findOne({ registrationNumber });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (action === "enroll") {
      // Avoid duplicate enrollments
      if (!student.courses.includes(courseCode)) {
        student.courses.push(courseCode);
      }
    } else if (action === "unenroll") {
      student.courses = student.courses.filter((code) => code !== courseCode);
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    await student.save();
    return res.status(200).json({ message: `Successfully ${action}ed.` });
  } catch (err) {
    console.error("Error updating course:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/courses", async (req, res) => {
  const { registrationNumber } = req.query;

  try {
    const student = await User.findOne({ registrationNumber });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const allCourses = await Course.find();

    res.json({
      section: student.section,
      enrolledCourseCodes: student.courses,
      allCourses,
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/quizzes", async (req, res) => {
  try {
    const { studentId, section } = req.query;
    const now = new Date();

    const [quizzes, registrations] = await Promise.all([
      Quiz.find({ section }).lean(),
      StudentRegistration.find({ studentRegNo: studentId }).lean(),
    ]);

    const registrationMap = new Map();
    registrations.forEach((r) => {
      registrationMap.set(r.quizTitle, r);
    });

    const result = quizzes.map((quiz) => {
      const reg = registrationMap.get(quiz.title);
      const isRegistered = !!reg;
      const hasAttempted = reg?.hasAttempted || false;
      const registrationStatus = reg?.approvedByTeacher || "not_registered";

      const canRegister = now >= quiz.RegStartTime && now <= quiz.RegEndTime;
      const canAttempt =
        now >= quiz.startTime &&
        now <= quiz.endTime &&
        isRegistered &&
        reg?.approvedByTeacher === "accepted";

      return {
        ...quiz,
        isRegistered,
        hasAttempted,
        registrationStatus,
        canRegister,
        canAttempt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Failed to fetch quizzes:", err);
    res.status(500).json({ message: "Server error while fetching quizzes" });
  }
});

router.post("/register-quiz", async (req, res) => {
  try {
    const { studentRegNo, quizTitle, teacherRegNo } = req.body;

    const alreadyRegistered = await StudentRegistration.findOne({
      studentRegNo,
      quizTitle,
    });

    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ message: "Already registered for this quiz" });
    }

    const registration = new StudentRegistration({
      studentRegNo,
      quizTitle,
      teacherRegNo,
    });

    await registration.save();
    res.json({ message: "Registration successful", registration });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error while registering" });
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
