const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    section: {type: String,default:""},
    // Registration Number with validation
    registrationNumber: { 
        type: String, 
        required: true,
        unique: true,
        validate: {
            validator: function (value) {
                if (this.role === "student") {
                    return /^122\d{5}$/.test(value); // Student: Starts with 122 + 5 digits
                } else if (this.role === "teacher") {
                    return /^\d{5}$/.test(value); // Teacher: Exactly 5 digits
                }
                return false;
            },
            message: (props) => `Invalid registration number format for ${props.value}`,
        },
    },
    updatedByTeacher: { type: Boolean, default: false },

});

module.exports = mongoose.model("User", UserSchema);
