// routes/notesRoutes.js
// Student routes for accessing notes

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getStudentNotes, downloadNote } = require("../controllers/notesController");

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
router.get("/", getStudentNotes);           // Get available notes
router.get("/download/:id", downloadNote);  // Download a note

module.exports = router;
