// models/Student.js
const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true },
    subjectName: { type: String },

    cie1: { type: Number, min: 0 },
    cie2: { type: Number, min: 0 },
    aat: { type: Number, min: 0 },
    lab: { type: Number, min: 0 },
    cieTotal: { type: Number, min: 0 },
    seeMarks: { type: Number, min: 0, max: 100 },
    semester: Number,
    academicYear: String,
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema({
  usn: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  course: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  section: String,
  dob: Date,
  address: String,
  passwordHash: { type: String, required: true },
  marks: [marksSchema],
  createdAt: { type: Date, default: Date.now },
});

// Set virtuals to be included in JSON
studentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Student", studentSchema);
