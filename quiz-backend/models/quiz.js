const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
    title: String,
    questions: [{ 
        question: String, 
        options: [String], 
        answer: Number 
    }],
    teacherId: mongoose.Schema.Types.ObjectId,
    password: String,
    startTime: Date,
    endTime: Date,
    students: [{ studentId: mongoose.Schema.Types.ObjectId, score: Number }]
});

module.exports = mongoose.model("Quiz", QuizSchema);
 
