const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // Course determines eligibility
    section: { type: String, required: true }, // Section is required to target specific students
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    password: { type: String, required: true },  // Must be hashed
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    // Questions array
    questions: [
        {
            questionText: { type: String, required: true },
            options: { 
                type: [String], 
                required: true, 
                validate: v => v.length === 4  // Enforces exactly 4 options
            }, 
            correctAnswer: { type: Number, required: true, min: 0, max: 3 }
        }
    ],

    // Student scores (hidden from students)
    studentScores: [{ 
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
        score: { type: Number, default: 0 } 
    }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
QuizSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model("Quiz", QuizSchema);
