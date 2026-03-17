// src/App.js - Updated with AdminLayout wrapper
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";
import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import AdminLogin from "./pages/AdminLogin";
import "./styles/globals.css";
import StudentChat from "./pages/StudentChat";

// Admin Components
import AdminLayout from "./components/admin/AdminLayout";
import DashboardContent from "./components/admin/DashboardContent";
import FAQManager from "./components/admin/FAQManager";
import NoticeManager from "./components/admin/NoticeManager";
import StudentManager from "./components/admin/StudentManager";
import TeacherManager from "./components/admin/TeacherManager";
import SubjectManager from "./components/admin/SubjectManager";
import FeedbackManager from "./components/admin/FeedbackManager";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard";

// Teacher Components
import TeacherChat from "./pages/TeacherChat";
import TeacherDashboard from "./pages/TeacherDashboard";

// Admin Page Wrapper - Wraps content in AdminLayout
const AdminPage = ({ children }) => (
  <AdminLayout>{children}</AdminLayout>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/faculty" element={<FacultyLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/student/chat" element={<StudentChat />} />

          {/* Admin Routes - Wrapped in AdminLayout */}
          <Route path="/admin/dashboard" element={<AdminPage><DashboardContent /></AdminPage>} />
          <Route path="/admin/faqs" element={<AdminPage><FAQManager /></AdminPage>} />
          <Route path="/admin/notices" element={<AdminPage><NoticeManager /></AdminPage>} />
          <Route path="/admin/students" element={<AdminPage><StudentManager /></AdminPage>} />
          <Route path="/admin/teachers" element={<AdminPage><TeacherManager /></AdminPage>} />
          <Route path="/admin/subjects" element={<AdminPage><SubjectManager /></AdminPage>} />
          <Route path="/admin/feedback" element={<AdminPage><FeedbackManager /></AdminPage>} />
          <Route path="/admin/analytics" element={<AdminPage><AnalyticsDashboard /></AdminPage>} />

          {/* Teacher Routes */}
          <Route path="/faculty/chat" element={<TeacherChat />} />
          <Route path="/faculty/dashboard" element={<TeacherDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
