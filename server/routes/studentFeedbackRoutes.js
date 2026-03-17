// routes/studentFeedbackRoutes.js
// Student routes for teacher feedback

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getActiveSession, submitFeedback } = require("../controllers/feedbackController");

// Student verification middleware
const verifyStudent = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback-secret-for-testing"
        );

        if (decoded.role !== "student") {
            return res.status(403).json({ message: "Student access only" });
        }

        req.user = decoded;
        req.student = { _id: decoded.id };
        next();
    } catch (error) {
        res.status(401).json({ message: `Invalid token: ${error.message}` });
    }
};

// Apply middleware
router.use(verifyStudent);

// Routes
router.get("/active", getActiveSession);    // Check for active session and get questions/teachers
router.post("/submit", submitFeedback);     // Submit feedback

module.exports = router;
