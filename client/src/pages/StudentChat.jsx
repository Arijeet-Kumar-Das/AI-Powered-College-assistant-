import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API, { BASE_URL } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackModal from "../components/student/FeedbackModal";

const StudentChat = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [teachersToRate, setTeachersToRate] = useState([]);
  const [feedbackQuestions, setFeedbackQuestions] = useState([]);

  // Check for active feedback session
  useEffect(() => {
    const checkFeedbackStatus = async () => {
      try {
        const token = localStorage.getItem("studentToken");
        if (!token) return;

        const res = await API.get("/api/feedback/active");


        if (res.data.success && res.data.session && res.data.teachersToRate.length > 0) {
          setFeedbackSession(res.data.session);
          setTeachersToRate(res.data.teachersToRate);
          setFeedbackQuestions(res.data.questions);
          setShowFeedback(true);
        }
      } catch (error) {
        console.error("Error checking feedback status:", error);
      }
    };

    checkFeedbackStatus();
  }, []);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentToken, setStudentToken] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open
  const [activeTab, setActiveTab] = useState("actions"); // actions, notices, notes, faq
  const [notices, setNotices] = useState([]);
  const [readNotices, setReadNotices] = useState([]);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load read notices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("readNotices");
    if (saved) setReadNotices(JSON.parse(saved));
  }, []);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/notices/students`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  // Fetch notes
  const fetchNotes = async (token) => {
    try {
      setNotesLoading(true);
      const res = await fetch(`${BASE_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading(false);
    }
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      setFaqsLoading(true);
      const res = await fetch(`${BASE_URL}/api/admin/faqs/public`);
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Filter FAQs by search
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.tags?.some(tag => tag.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  useEffect(() => {
    fetchNotices();
  }, []);

  // Mark notice as read
  const markAsRead = (noticeId) => {
    if (!readNotices.includes(noticeId)) {
      const updated = [...readNotices, noticeId];
      setReadNotices(updated);
      localStorage.setItem("readNotices", JSON.stringify(updated));
    }
  };

  // Download note
  const downloadNote = async (noteId, fileName) => {
    try {
      const token = localStorage.getItem("studentToken");
      const res = await fetch(`${BASE_URL}/api/notes/download/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading note:", error);
    }
  };

  // Get unread count
  const unreadCount = notices.filter(n => !readNotices.includes(n._id)).length;

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentData");
    navigate("/login/student");
  };

  // Auto-resize textarea
  const adjustHeight = useCallback((el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px"; // Limit max height
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    if (token) {
      setStudentToken(token);
      fetchNotes(token);
    }

    // Auto-close sidebar on mobile on load
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !studentToken) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const tempInput = inputMessage;
    setInputMessage("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    setLoading(true);

    try {
      const { data } = await API.post(
        "/api/chat/student",
        { message: tempInput },
        {
          headers: {
            Authorization: `Bearer ${studentToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: data.response,
        intent: data.intent,
        studentInfo: data.student,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error.response?.data || error);
      const errorMsg = {
        id: Date.now() + 1,
        role: "bot",
        content:
          error.response?.data?.response ||
          error.response?.data?.message ||
          "Connection failed. Check if server is running on port 5000.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden font-sans">
      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && feedbackSession && (
          <FeedbackModal
            session={feedbackSession}
            teachers={teachersToRate}
            questions={feedbackQuestions}
            onClose={() => setShowFeedback(false)}
            onComplete={() => {
              setShowFeedback(false);
              alert("Thank you for your feedback!");
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Backdrop for Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: sidebarOpen ? 0 : 0, // Controlled via layout on desktop, transform on mobile handled by CSS usually, but we use width here
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed md:relative z-30 h-full bg-white shadow-xl border-r border-gray-200 flex flex-col flex-shrink-0 transition-transform duration-300 ${
          // On mobile: fixed position, slide in/out. On Desktop: relative flex item
          !sidebarOpen && window.innerWidth < 768
            ? "-translate-x-full md:translate-x-0"
            : "translate-x-0"
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div
            className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"
              } mb-6`}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 text-white font-bold">
              SA
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0 flex-1"
              >
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  Assistant
                </h2>
                <p className="text-xs text-gray-500">Student Helper</p>
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMessages([])}
            className={`w-full flex items-center ${sidebarOpen ? "space-x-3 px-4" : "justify-center px-0"
              } py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors duration-200`}
            title="New Chat"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {sidebarOpen && <span>New Chat</span>}
          </motion.button>
        </div>

        {/* Sidebar Content - Quick Actions, Notices, or Notes */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Toggle Buttons - 3 Tabs */}
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${activeTab === "actions"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Actions
                  </button>
                  <button
                    onClick={() => setActiveTab("notices")}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors relative ${activeTab === "notices"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Notices
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors relative ${activeTab === "notes"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Notes
                    {notes.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {notes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("faq")}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${activeTab === "faq"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    FAQ
                  </button>
                </div>

                {/* Quick Actions Content */}
                {activeTab === "actions" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">
                      Quick Actions
                    </p>
                    {[
                      "What is my USN?",
                      "Show my profile",
                      "Which semester?",
                      "My department?",
                      "Contact details",
                      "My attendance",
                      "Show my marks",
                    ].map((text, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(text)}
                        className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm transition-colors duration-200 truncate border border-transparent hover:border-gray-200"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Notices Content */}
                {activeTab === "notices" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">
                      Announcements
                    </p>
                    {notices.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No notices available</p>
                    ) : (
                      notices.map((notice) => {
                        const isRead = readNotices.includes(notice._id);
                        return (
                          <div
                            key={notice._id}
                            onClick={() => markAsRead(notice._id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isRead
                              ? "bg-gray-50 border-gray-200"
                              : "bg-blue-50 border-blue-200 shadow-sm"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${isRead ? "text-gray-700" : "text-gray-900"}`}>
                                {!isRead && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>}
                                {notice.title}
                              </h4>
                              {notice.priority === "urgent" && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Urgent</span>
                              )}
                              {notice.priority === "high" && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">High</span>
                              )}
                            </div>
                            <p className={`text-xs mt-1 line-clamp-2 ${isRead ? "text-gray-500" : "text-gray-600"}`}>
                              {notice.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notice.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Notes Content */}
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">
                      📚 Study Materials
                    </p>
                    {notesLoading ? (
                      <p className="text-sm text-gray-500 text-center py-4">Loading notes...</p>
                    ) : notes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No notes available for your subjects</p>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{note.title}</h4>
                              <p className="text-xs text-blue-600 mt-0.5">{note.subjectCode} - {note.subjectName}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                By {note.uploadedBy} • {(note.fileSize / 1024).toFixed(0)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => downloadNote(note.id, note.fileName)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Download PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* FAQ Content */}
                {activeTab === "faq" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">
                      ❓ Frequently Asked Questions
                    </p>
                    {/* Search Box */}
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {faqsLoading ? (
                      <p className="text-sm text-gray-500 text-center py-4">Loading FAQs...</p>
                    ) : filteredFaqs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {faqSearch ? "No FAQs match your search" : "No FAQs available"}
                      </p>
                    ) : (
                      filteredFaqs.map((faq) => (
                        <div
                          key={faq._id}
                          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === faq._id ? null : faq._id)}
                            className="w-full p-3 text-left flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                            <svg
                              className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${expandedFaq === faq._id ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedFaq === faq._id && (
                            <div className="px-3 pb-3 border-t border-gray-100">
                              <p className="text-sm text-gray-600 pt-2 whitespace-pre-wrap">{faq.answer}</p>
                              {faq.category && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                                  {faq.category}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Icon-only fallback when closed (optional) */}
          {!sidebarOpen && (
            <div className="flex flex-col items-center space-y-4 pt-4">
              <button
                onClick={() => { setSidebarOpen(true); setActiveTab("notices"); }}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                title="View Notices"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => { setSidebarOpen(true); setActiveTab("notes"); }}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                title="View Notes"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {notes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">{notes.length}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Top Navbar */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              Student Assistant
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-400 font-mono hidden sm:block">
              {loading ? "Thinking..." : "Online"}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div >

        {/* Messages List */}
        < div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" >
          {
            messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"
                >
                  <span className="text-4xl">🎓</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome Back!
                </h3>
                <p className="text-gray-500 max-w-sm">
                  I can help you check your academic details. Try asking "What is
                  my USN?"
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xl p-5 rounded-2xl shadow-sm border ${msg.role === "user"
                      ? "bg-blue-600 text-white border-blue-600 rounded-br-sm"
                      : "bg-white text-gray-800 border-gray-200 rounded-bl-sm"
                      }`}
                  >
                    <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    <div
                      className={`text-[10px] mt-2 flex items-center justify-end gap-2 ${msg.role === "user" ? "text-blue-100" : "text-gray-400"
                        }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.intent && (
                        <span className="px-1.5 py-0.5 rounded bg-black/5 uppercase tracking-wider font-bold">
                          {msg.intent}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )
          }

          {
            loading && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm flex items-center space-x-2">
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            )
          }
          <div ref={messagesEndRef} />
        </div >

        {/* Input Area */}
        < div className="p-4 bg-white border-t border-gray-200" >
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                adjustHeight(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                !studentToken
                  ? "Please login first..."
                  : "Type your query here..."
              }
              disabled={loading || !studentToken}
              className="w-full py-3 px-4 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none max-h-32 min-h-[50px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 placeholder-gray-500"
              rows={1}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim() || !studentToken}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 mb-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI responses may vary. Check with college admin for official
            records.
          </p>
        </div >
      </div >
    </div >
  );
};

export default StudentChat;
