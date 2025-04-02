const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [{ 
        question: { type: String, required: true }, 
        options: { type: [String], required: true, validate: v => v.length === 4 }, 
        answer: { type: Number, required: true, min: 0, max: 3 } 
    }],
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    password: { type: String, required: true },  // Must be hashed before saving!
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    students: [{ 
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
        score: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware to hash password before saving
QuizSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        const bcrypt = require("bcryptjs");
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model("Quiz", QuizSchema);
