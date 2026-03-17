// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
// Admin Login Controller
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: "admin", username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.teacherLogin = async (req, res) => {
  console.log("TEACHER LOGIN HIT");
  console.log("Body:", req.body);

  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      console.log("Missing employeeId or password");
      return res
        .status(400)
        .json({ success: false, message: "Employee ID and password required" });
    }

    console.log("✅ Teacher model loaded");

    const teacher = await Teacher.findOne({ employeeId });
    console.log("Found teacher:", teacher ? teacher.name : "NONE");

    if (!teacher) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const bcrypt = require("bcryptjs");
    const validPassword = await bcrypt.compare(password, teacher.passwordHash);
    console.log("Password valid:", validPassword);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: teacher._id, role: "faculty", employeeId: teacher.employeeId },
      process.env.JWT_SECRET || "fallback-secret-for-testing",
      { expiresIn: "6h" }
    );

    console.log("LOGIN SUCCESSFUL");
    res.json({
      success: true,
      token,
      teacher: {
        id: teacher._id,
        employeeId: teacher.employeeId,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        subjectsAssigned: teacher.subjectsAssigned,
      },
    });
  } catch (err) {
    console.error("TEACHER LOGIN ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.studentLogin = async (req, res) => {
  console.log("STUDENT LOGIN HIT");
  console.log("Body:", req.body);

  try {
    const { usn, password } = req.body;

    // Basic validation
    if (!usn || !password) {
      console.log("Missing usn or password");
      return res
        .status(400)
        .json({ success: false, message: "USN and password required" });
    }

    // Find student by USN
    const student = await Student.findOne({ usn });
    console.log("Found student:", student ? student.name : "NONE");

    if (!student) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, student.passwordHash);
    console.log("Password valid:", validPassword);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
        usn: student.usn,
        department: student.department,
        semester: student.semester,
      },
      process.env.JWT_SECRET || "fallback-secret-for-testing",
      { expiresIn: "6h" }
    );

    console.log("STUDENT LOGIN SUCCESSFUL");

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        usn: student.usn,
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.course,
        department: student.department,
        semester: student.semester,
        section: student.section,
      },
    });
  } catch (err) {
    console.error("STUDENT LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
