// models/Subject.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, unique: true, required: true },
  subjectName: { type: String, required: true },
  subjectType: {
    type: String,
    enum: ["integrated", "non-integrated"],
    required: true,
  }, // Better here!
  department: String,
  semester: Number,
  credits: Number,
});

module.exports = mongoose.model("Subject", subjectSchema);
