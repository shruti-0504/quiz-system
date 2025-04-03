const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
    courseCode: { type: String, unique: true, required: true },
    courseName: { type: String, required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Enrolled students
});

module.exports = mongoose.model("Course", CourseSchema);
