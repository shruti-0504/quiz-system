const express = require("express");
const Quiz = require("../models/Quiz");
const router = express.Router();

router.post("/create", async (req, res) => {
    const { title, questions, password, startTime, endTime, teacherId } = req.body;
    try {
        const quiz = await Quiz.create({ title, questions, password, startTime, endTime, teacherId });
        res.json({ message: "Quiz created successfully!" });
    } catch (err) {
        res.status(400).json({ message: "Error creating quiz." });
    }
});

router.post("/attempt", async (req, res) => {
    const { quizId, studentId, password } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.password !== password) return res.status(401).json({ message: "Wrong password!" });
    res.json({ quiz });
});

router.post("/submit", async (req, res) => {
    const { quizId, studentId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    let score = 0;
    quiz.questions.forEach((q, index) => {
        if (answers[index] === q.answer) score++;
    });
    quiz.students.push({ studentId, score });
    await quiz.save();
    res.json({ message: "Quiz submitted!" });
});

module.exports = router;
 
