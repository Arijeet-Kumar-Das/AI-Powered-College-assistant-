// routes/authRoutes.js
const express = require("express");
const {
  adminLogin,
  teacherLogin,
  studentLogin,
} = require("../controllers/authController.js");

const router = express.Router();

// POST /api/auth/admin/login
router.post("/admin/login", adminLogin);

router.post("/teacher/login", teacherLogin);
router.post("/student/login", studentLogin);

module.exports = router;
