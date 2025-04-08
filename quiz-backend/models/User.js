const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], required: true },
  courses: [{ type: String }],
  section: { type: String, default: "" },
  registrationNumber: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("User", UserSchema);
