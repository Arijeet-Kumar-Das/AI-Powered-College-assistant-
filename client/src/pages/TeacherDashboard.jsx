// src/pages/TeacherDashboard.jsx
// Modern teacher dashboard with sidebar navigation

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    ClipboardList,
    MessageCircle,
    LogOut,
    Menu,
    X,
    GraduationCap,
    BookOpen,
    Users,
    ChevronRight,
    FileUp,
    Star,
    Calendar,
} from "lucide-react";
import MarksManager from "../components/teacher/MarksManager";
import NotesManager from "../components/teacher/NotesManager";
import TeacherFeedbackView from "../components/teacher/TeacherFeedbackView";
import AttendanceManager from "../components/teacher/AttendanceManager";

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [teacherData, setTeacherData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("teacherToken");
        const data = localStorage.getItem("teacherData");

        if (!token || !data) {
            navigate("/login/faculty");
            return;
        }

        setTeacherData(JSON.parse(data));
        fetchSubjects(token);

        // Auto-close sidebar on mobile
        if (window.innerWidth < 768) setSidebarOpen(false);
    }, [navigate]);

    const fetchSubjects = async (token) => {
        try {
            const response = await fetch("http://localhost:5000/api/teacher/subjects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setSubjects(data.subjects);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherData");
        navigate("/login/faculty");
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "marks", label: "Marks Entry", icon: ClipboardList },
        { id: "attendance", label: "Attendance", icon: Calendar },
        { id: "notes", label: "Upload Notes", icon: FileUp },
        { id: "feedback", label: "My Feedback", icon: Star },
        { id: "chat", label: "AI Chat", icon: MessageCircle },
    ];

    if (!teacherData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarOpen ? 288 : 0,
                    opacity: sidebarOpen ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed md:sticky top-0 left-0 z-50 h-screen bg-white/10 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden"
            >
                <div className="w-72 h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Faculty Portal</h2>
                                    <p className="text-purple-300 text-xs">BMS College</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Teacher Info Card */}
                    <div className="p-4">
                        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold">
                                    {teacherData.name?.charAt(0) || "T"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">
                                        {teacherData.name}
                                    </p>
                                    <p className="text-purple-300 text-xs">{teacherData.employeeId}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-purple-200">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{subjects.length} subjects assigned</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </motion.button>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white capitalize">
                                    {activeSection === "marks" ? "Marks Entry" : activeSection}
                                </h1>
                                <p className="text-sm text-purple-300">{teacherData.department}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm text-white/80">
                                <Users className="w-4 h-4" />
                                <span>{subjects.length} Subjects</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <AnimatePresence mode="wait">
                        {activeSection === "dashboard" && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Welcome Card */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        Welcome back, {teacherData.name?.split(" ")[0]}! 👋
                                    </h2>
                                    <p className="text-white/80">
                                        Manage your class marks and chat with the AI assistant.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                                <BookOpen className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white/60 text-sm">Subjects</p>
                                                <p className="text-3xl font-bold text-white">{subjects.length}</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                                                <ClipboardList className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white/60 text-sm">Department</p>
                                                <p className="text-lg font-bold text-white truncate">
                                                    {teacherData.department}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                                                <GraduationCap className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white/60 text-sm">Employee ID</p>
                                                <p className="text-lg font-bold text-white">
                                                    {teacherData.employeeId}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Subjects List */}
                                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-4">Your Subjects</h3>
                                    <div className="grid gap-3">
                                        {subjects.length > 0 ? (
                                            subjects.map((subject, idx) => (
                                                <motion.div
                                                    key={subject.subjectCode}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                            {subject.subjectCode?.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {subject.subjectName}
                                                            </p>
                                                            <p className="text-purple-300 text-sm">
                                                                {subject.subjectCode} • Sem {subject.semester}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${subject.subjectType === "integrated"
                                                            ? "bg-emerald-500/20 text-emerald-300"
                                                            : "bg-blue-500/20 text-blue-300"
                                                            }`}
                                                    >
                                                        {subject.subjectType}
                                                    </span>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-white/50">
                                                No subjects assigned yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "marks" && (
                            <motion.div
                                key="marks"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <MarksManager subjects={subjects} />
                            </motion.div>
                        )}

                        {activeSection === "notes" && (
                            <motion.div
                                key="notes"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <NotesManager subjects={subjects} />
                            </motion.div>
                        )}

                        {activeSection === "attendance" && (
                            <motion.div
                                key="attendance"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <AttendanceManager subjects={subjects} />
                            </motion.div>
                        )}

                        {activeSection === "chat" && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-[calc(100vh-180px)]"
                            >
                                <EmbeddedChat teacherData={teacherData} />
                            </motion.div>
                        )}

                        {activeSection === "feedback" && (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <TeacherFeedbackView />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

// Embedded Chat Component (simplified version of TeacherChat)
const EmbeddedChat = ({ teacherData }) => {
    const [messages, setMessages] = useState([
        {
            role: "bot",
            content: `Hello **${teacherData.name}**! 👋 I'm your AI teaching assistant. Ask me about your subjects, credits, or anything else!`,
            timestamp: new Date().toISOString(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: "user",
            content: inputMessage,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("teacherToken");
            const response = await fetch("http://localhost:5000/api/chat/teacher", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: inputMessage }),
            });
            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: data.response,
                    timestamp: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: "Sorry, something went wrong. Please try again.",
                    timestamp: new Date().toISOString(),
                    error: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user"
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm"
                                : msg.error
                                    ? "bg-red-500/20 text-red-200 border border-red-500/30"
                                    : "bg-white/10 text-white rounded-bl-sm"
                                }`}
                        >
                            <div
                                className="prose prose-sm prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"),
                                }}
                            />
                            <p className="text-xs mt-2 opacity-60">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75" />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ask anything..."
                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
