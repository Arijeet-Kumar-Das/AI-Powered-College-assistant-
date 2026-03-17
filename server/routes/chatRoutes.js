const express = require("express");
const router = express.Router();
const { teacherChat, studentChat } = require("../controllers/chatController");
const jwt = require("jsonwebtoken");

// ✅ FIXED: Student middleware (you were missing this!)
const verifyStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header missing. Use: Bearer <token>",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-for-testing"
    );

    if (decoded.role !== "student") {
      return res.status(403).json({
        message: `Student access only. Got role: ${decoded.role}`,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("🔒 ROUTE MIDDLEWARE ERROR:", error.message);
    res.status(401).json({ message: `Invalid token: ${error.message}` });
  }
};

// Teacher middleware
const verifyTeacher = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-for-testing"
    );
    if (decoded.role !== "faculty") {
      return res.status(403).json({ message: "Faculty access only" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: `Invalid token: ${error.message}` });
  }
};

// ✅ ROUTES WITH PROPER MIDDLEWARE
router.post("/teacher", verifyTeacher, teacherChat);
router.post("/student", verifyStudent, studentChat); // ← THIS WAS MISSING!

module.exports = router;
