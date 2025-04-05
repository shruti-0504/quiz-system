const mongoose = require("mongoose");

const StudentRegistrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  approvedByTeacher: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  hasAttempted: { type: Boolean, default: false }, // To prevent reattempts
});

module.exports = mongoose.model(
  "StudentRegistration",
  StudentRegistrationSchema
);
