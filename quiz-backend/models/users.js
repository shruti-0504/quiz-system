const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["student", "teacher"], required: true },
    approved: { type: Boolean, default: true }
});

module.exports = mongoose.model("User", UserSchema);
 
