// routes/teacherRoutes.js
// Teacher-specific routes for marks management and notes upload

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
    getTeacherSubjects,
    getStudentsForSubject,
    updateStudentMarks,
    bulkUpdateMarks,
    getMarksForSubject,
} = require("../controllers/marksController");
const {
    uploadNote,
    getTeacherNotes,
    deleteNote,
    getTeacherSubjects: getSubjectsForNotes,
} = require("../controllers/notesController");
const { getOwnFeedback } = require("../controllers/feedbackController");
const {
    getStudentsForSubject: getStudentsForAttendance,
    markAttendance,
    getAttendanceHistory,
    getAttendanceByDate,
} = require("../controllers/attendanceController");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/notes");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-originalname
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    // Accept only PDFs
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Teacher verification middleware
const verifyTeacher = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback-secret-for-testing"
        );

        if (decoded.role !== "faculty") {
            return res.status(403).json({ message: "Faculty access only" });
        }

        req.user = decoded;
        req.teacher = { _id: decoded.id }; // For notes controller
        next();
    } catch (error) {
        res.status(401).json({ message: `Invalid token: ${error.message}` });
    }
};

// Apply middleware to all routes
router.use(verifyTeacher);

// Marks management routes
router.get("/subjects", getTeacherSubjects);
router.get("/students/:subjectCode", getStudentsForSubject);
router.post("/marks", updateStudentMarks);
router.post("/marks/bulk", bulkUpdateMarks);
router.get("/marks/:subjectCode", getMarksForSubject);

// Notes upload routes
router.get("/notes/subjects", getSubjectsForNotes); // Subjects for dropdown
router.get("/notes", getTeacherNotes);              // Get teacher's notes
router.post("/notes/upload", upload.single("file"), uploadNote); // Upload note
router.delete("/notes/:id", deleteNote);            // Delete note

// Feedback routes
router.get("/feedback/my-results", getOwnFeedback); // View feedback

// Attendance routes
router.get("/attendance/students/:subjectCode", getStudentsForAttendance); // Get students for attendance
router.post("/attendance/mark", markAttendance);                            // Mark attendance
router.get("/attendance/history/:subjectCode", getAttendanceHistory);       // Get history
router.get("/attendance/:subjectCode/:date", getAttendanceByDate);          // Get by date

module.exports = router;
