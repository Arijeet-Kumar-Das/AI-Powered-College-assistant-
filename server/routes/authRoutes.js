// routes/authRoutes.js
const express = require("express");
const {
  adminLogin,
  teacherLogin,
  studentLogin,
  demoAdminLogin,
} = require("../controllers/authController.js");

const router = express.Router();

// POST /api/auth/admin/login
router.post("/admin/login", adminLogin);

// POST /api/auth/admin/demo-login  (no credentials required)
router.post("/admin/demo-login", demoAdminLogin);

router.post("/teacher/login", teacherLogin);
router.post("/student/login", studentLogin);

module.exports = router;

