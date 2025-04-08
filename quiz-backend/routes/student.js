const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const router = express.Router();

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
    const studentId = req.user._id; // fetched from auth middleware
    const { section } = req.query;

    // Step 1: Get all approved and not-yet-attempted quiz registrations for the student
    const registrations = await StudentRegistration.find({
      studentId,
      approvedByTeacher: "accepted",
      hasAttempted: false,
    }).select("quizId");

    const quizIds = registrations.map((r) => r.quizId);

    // Step 2: Filter quizzes for the student's section and time
    const currentTime = new Date();

    const quizzes = await Quiz.find({
      _id: { $in: quizIds },
      section: section,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
    });

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
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
