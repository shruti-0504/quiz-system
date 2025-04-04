const express = require("express");
const Quiz = require("../models/Quiz");
const router = express.Router();

app.post('/quiz/create', async (req, res) => {
    const { title, questions, duration, password } = req.body;
    // Save to DB (add validation, check duplicates, etc.)
    const newQuiz = await Quiz.create({ title, questions, duration, password });
    res.status(201).json({ quizId: newQuiz._id });
});
app.post('/quiz/allot', async (req, res) => {
    const { quizId, students } = req.body;
    // For each student, you can create a record in a "QuizAttempts" or similar table
    students.forEach(async (email) => {
        await QuizAttempt.create({ quizId, studentEmail: email, status: "pending" });
    });
    res.status(200).json({ message: "Quiz allotted successfully." });
});

module.exports = router;
 
