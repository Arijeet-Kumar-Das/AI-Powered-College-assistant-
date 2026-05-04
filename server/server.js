


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

// CORS 
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback: allow all (change to false after testing)
  },
  credentials: true,
}));

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

// ==================== RENDER KEEP-ALIVE ====================

const SELF_PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

const startKeepAlive = () => {
  const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (!backendUrl) {
    console.log("  No RENDER_EXTERNAL_URL or BACKEND_URL set — keep-alive disabled (local dev)");
    return;
  }

  console.log(` Keep-alive enabled: pinging ${backendUrl} every 14 minutes`);

  setInterval(async () => {
    try {
      const res = await fetch(backendUrl);
      console.log(` Keep-alive ping: ${res.status} at ${new Date().toISOString()}`);
    } catch (err) {
      console.error(" Keep-alive ping failed:", err.message);
    }
  }, SELF_PING_INTERVAL);
};

// Start Server
const startServer = async () => {
  try {
    await connectDb();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      startKeepAlive(); // Start self-pinging after server is up
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();