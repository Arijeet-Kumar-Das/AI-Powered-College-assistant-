// models/Teacher.js
const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true }, // employee USN
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    subjectsAssigned: [
      {
        subjectCode: String,
        subjectName: String,
      },
    ],
    role: { type: String, default: "faculty" }, // for role-based access if needed
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
