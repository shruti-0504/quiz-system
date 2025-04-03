const mongoose = require("mongoose");

const StudentResponseSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    answers: [{ questionId: mongoose.Schema.Types.ObjectId, selectedOption: Number }],  
    score: Number,
});

module.exports = mongoose.model("StudentResponse", StudentResponseSchema);
