// routes/studentAttendanceRoutes.js
// Student-specific attendance routes

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getMyAttendance } = require("../controllers/attendanceController");

// Student verification middleware
const verifyStudent = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "student") {
            return res.status(403).json({ message: "Student access only" });
        }

        req.student = { _id: decoded.id };
        next();
    } catch (error) {
        res.status(401).json({ message: `Invalid token: ${error.message}` });
    }
};

// Apply middleware
router.use(verifyStudent);

// Get student's own attendance
router.get("/my-attendance", getMyAttendance);

module.exports = router;
