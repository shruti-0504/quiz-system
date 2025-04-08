const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseCode: { type: String, unique: true, required: true },
  courseName: { type: String, required: true },
  studentRegNos: [{ type: String, ref: "User" }], // Instead of ObjectId
});

module.exports = mongoose.model("Course", CourseSchema);
