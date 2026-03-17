// src/pages/faculty/TeacherChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bot,
  User,
  Send,
  MessageCircle,
  GraduationCap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const TeacherChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [showNotices, setShowNotices] = useState(false);
  const [notices, setNotices] = useState([]);
  const [readNotices, setReadNotices] = useState([]);
  const messagesEndRef = useRef(null);

  // Load read notices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("teacherReadNotices");
    if (saved) setReadNotices(JSON.parse(saved));
  }, []);

  // Fetch notices for faculty
  const fetchNotices = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/notices/faculty");
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Mark notice as read
  const markAsRead = (noticeId) => {
    if (!readNotices.includes(noticeId)) {
      const updated = [...readNotices, noticeId];
      setReadNotices(updated);
      localStorage.setItem("teacherReadNotices", JSON.stringify(updated));
    }
  };

  // Get unread count
  const unreadCount = notices.filter(n => !readNotices.includes(n._id)).length;

  // Load teacher data on mount
  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    const data = localStorage.getItem("teacherData");

    if (!token || !data) {
      navigate("/faculty/login");
      return;
    }

    const teacher = JSON.parse(data);
    setTeacherData(teacher);

    // Welcome message
    setMessages([
      {
        role: "bot",
        content: `Hello **${teacher.name}** (${teacher.employeeId})! 👋\n\nI'm your teaching assistant. Ask me about your subjects, credits, semesters, or department!\n\n**Examples:**\n• What subjects am I teaching?\n• How many credits for my subjects?\n• Which semester are my subjects?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [navigate]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
      const response = await axios.post(
        "http://localhost:5000/api/chat/teacher",
        { message: inputMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage = {
        role: "bot",
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content:
          "Sorry, I encountered an error. Please try again or contact support.",
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!teacherData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/faculty/dashboard")}
                className="p-2 hover:bg-indigo-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <MessageCircle className="w-7 h-7 text-indigo-600" />
                  <span>Teaching Assistant</span>
                </h1>
                <p className="text-sm text-gray-600">
                  Hi {teacherData.name}! ({teacherData.employeeId})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <GraduationCap className="w-4 h-4" />
                <span>{teacherData.subjectsCount || 0} subjects</span>
              </div>
              {/* Notices Button */}
              <button
                onClick={() => setShowNotices(!showNotices)}
                className={`relative p-2 rounded-lg transition-colors ${showNotices ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100 text-gray-600"
                  }`}
                title="View Notices"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notices Panel (Collapsible) */}
      {showNotices && (
        <div className="bg-white border-b border-indigo-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">📢 Announcements</h3>
              <button
                onClick={() => setShowNotices(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No notices available</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notices.map((notice) => {
                  const isRead = readNotices.includes(notice._id);
                  return (
                    <div
                      key={notice._id}
                      onClick={() => markAsRead(notice._id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${isRead
                          ? "bg-gray-50 border-gray-200"
                          : "bg-indigo-50 border-indigo-200"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium flex items-center ${isRead ? "text-gray-700" : "text-gray-900"}`}>
                          {!isRead && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>}
                          {notice.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {notice.priority === "urgent" && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Urgent</span>
                          )}
                          {notice.priority === "high" && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">High</span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${isRead ? "text-gray-500" : "text-gray-600"}`}>
                        {notice.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-6 py-8 h-[calc(100vh-140px)] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl shadow-lg ${message.role === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm"
                  : message.error
                    ? "bg-red-100 border border-red-200 text-red-800"
                    : "bg-white/70 backdrop-blur-sm border border-indigo-100 shadow-sm"
                  }`}
              >
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: message.content.replace(/\n/g, "<br>"),
                    }}
                  />
                </div>
                <div className="text-xs opacity-75 mt-2 flex items-center space-x-1">
                  {message.role === "user" ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/70 backdrop-blur-sm border border-indigo-100 p-4 rounded-2xl shadow-sm max-w-2xl">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span className="text-indigo-700 font-medium">
                    Assistant is typing...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-md border-t border-indigo-100 p-4 rounded-3xl shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-end space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your subjects, credits, semesters..."
              rows={1}
              className="flex-1 resize-none bg-white border border-indigo-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent transition-all min-h-[44px] max-h-32"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-5 h-5 ${isLoading ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherChat;
