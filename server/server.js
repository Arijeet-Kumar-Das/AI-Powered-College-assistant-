// Load environment variables FIRST, before any other imports
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
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

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/feedback", studentFeedbackRoutes);
app.use("/api/student/attendance", studentAttendanceRoutes);

// Connect to MongoDB and start the server
const startServer = async () => {
  await connectDb();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
