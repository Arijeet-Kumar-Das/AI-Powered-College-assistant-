

// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDb = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const teacherRoutes = require("./routes/teacherRoutes.js");
const notesRoutes = require("./routes/notesRoutes.js");
const studentFeedbackRoutes = require("./routes/studentFeedbackRoutes.js");
const studentAttendanceRoutes = require("./routes/studentAttendanceRoutes.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running ",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/feedback", studentFeedbackRoutes);
app.use("/api/student/attendance", studentAttendanceRoutes);

// Start Server
const startServer = async () => {
  try {
    await connectDb();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();