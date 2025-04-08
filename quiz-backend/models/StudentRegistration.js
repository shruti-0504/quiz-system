const mongoose = require("mongoose");

const StudentRegistrationSchema = new mongoose.Schema({
  studentRegNo: { type: String, ref: "User", required: true }, // instead of ObjectId
  quizTitle: { type: String, ref: "Quiz", required: true }, // instead of ObjectId
  approvedByTeacher: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  hasAttempted: { type: Boolean, default: false },
});

module.exports = mongoose.model(
  "StudentRegistration",
  StudentRegistrationSchema
);
