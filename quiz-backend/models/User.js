const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    section: {type: String,default:""},
    // Registration Number with validation
    registrationNumber: { type: String, required: true, unique: true,},
    updatedByTeacher: { type: Boolean, default: false },

});

module.exports = mongoose.model("User", UserSchema);
