const mongoose = require("mongoose");

const StudentResponseSchema = new mongoose.Schema({
  studentRegNo: { type: String, ref: "User", required: true },
  quizTitle: { type: String, ref: "Quiz", required: true },
  answers: [
    { questionId: mongoose.Schema.Types.ObjectId, selectedOption: Number },
  ],
  score: Number,
});

module.exports = mongoose.model("StudentResponse", StudentResponseSchema);
