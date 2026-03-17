// routes/adminRoutes.js
const express = require("express");
const multer = require("multer");
const {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  getStudentStats,
  getAllTeachers,
  getTeacherById,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  bulkUploadTeachers,
  getTeacherStats,
  getAllSubjects,
  getSubjectById,
  addSubject,
  updateSubject,
  deleteSubject,
  bulkUploadSubjects,
  getSubjectStats,
  getDashboardStats,
} = require("../controllers/adminController.js");

// Notice Controller
const {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  togglePin,
  archiveNotice,
  getNoticesForStudents,
  getNoticesForFaculty,
} = require("../controllers/noticeController.js");

// FAQ Controller
const {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  searchFAQs,
  getPublicFAQs,
} = require("../controllers/faqController.js");

// Feedback Controller
const {
  createSession,
  getSessions,
  toggleSession,
  deleteSession,
  getQuestions,
  addQuestion,
  toggleQuestion,
  deleteQuestion,
  getSessionResults,
} = require("../controllers/feedbackController.js");

const router = express.Router();

// Configure multer for Excel upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Dashboard Stats Route
router.get("/dashboard/stats", getDashboardStats);

// Student Management Routes (Admin only)
router.get("/students", getAllStudents);
router.get("/students/stats", getStudentStats);
router.get("/students/:id", getStudentById);
router.post("/students", addStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);
router.post("/students/bulk-upload", upload.single("file"), bulkUploadStudents);

// Teacher Management Routes
router.get("/teachers", getAllTeachers);
router.get("/teachers/stats", getTeacherStats);
router.get("/teachers/:id", getTeacherById);
router.post("/teachers", addTeacher);
router.put("/teachers/:id", updateTeacher);
router.delete("/teachers/:id", deleteTeacher);
router.post("/teachers/bulk-upload", upload.single("file"), bulkUploadTeachers);

// Subject Management Routes
router.get("/subjects", getAllSubjects);
router.get("/subjects/stats", getSubjectStats);
router.get("/subjects/:id", getSubjectById);
router.post("/subjects", addSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);
router.post("/subjects/bulk-upload", upload.single("file"), bulkUploadSubjects);

// ==================== NOTICE ROUTES ====================
router.get("/notices", getAllNotices);
router.get("/notices/students", getNoticesForStudents);  // Public endpoint for students
router.get("/notices/faculty", getNoticesForFaculty);    // Public endpoint for faculty
router.get("/notices/:id", getNoticeById);
router.post("/notices", createNotice);
router.put("/notices/:id", updateNotice);
router.patch("/notices/:id/pin", togglePin);
router.patch("/notices/:id/archive", archiveNotice);
router.delete("/notices/:id", deleteNotice);

// ==================== FAQ ROUTES ====================
router.get("/faqs", getAllFAQs);
router.get("/faqs/public", getPublicFAQs);  // Public endpoint
router.get("/faqs/search", searchFAQs);     // Search endpoint for chatbot
router.get("/faqs/:id", getFAQById);
router.post("/faqs", createFAQ);
router.put("/faqs/:id", updateFAQ);
router.delete("/faqs/:id", deleteFAQ);

// ==================== FEEDBACK ROUTES ====================
// Sessions
router.post("/feedback/sessions", createSession);
router.get("/feedback/sessions", getSessions);
router.put("/feedback/sessions/:id/toggle", toggleSession);
router.delete("/feedback/sessions/:id", deleteSession);
router.get("/feedback/results/:sessionId", getSessionResults);

// Questions
router.get("/feedback/questions", getQuestions);
router.post("/feedback/questions", addQuestion);
router.put("/feedback/questions/:id/toggle", toggleQuestion);
router.delete("/feedback/questions/:id", deleteQuestion);

module.exports = router;


