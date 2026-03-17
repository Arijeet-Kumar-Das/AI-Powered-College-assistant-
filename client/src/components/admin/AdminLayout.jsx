// src/components/admin/AdminLayout.jsx
// Shared layout wrapper for admin pages with sidebar navigation

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    GraduationCap,
    BookOpen,
    MessageSquare,
    Activity,
    Bell,
    FileText,
    BarChart3,
    LogOut,
    Settings,
    Menu,
    X,
    Star,
} from "lucide-react";

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [adminData, setAdminData] = useState(null);

    useEffect(() => {
        const admin = JSON.parse(localStorage.getItem("adminData"));
        if (!admin) {
            navigate("/login/admin");
        } else {
            setAdminData(admin);
        }
        // Auto-close sidebar on mobile
        if (window.innerWidth < 768) setSidebarOpen(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        navigate("/login/admin");
    };

    const menuItems = [
        { icon: Activity, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Users, label: "Students", path: "/admin/students" },
        { icon: GraduationCap, label: "Teachers", path: "/admin/teachers" },
        { icon: BookOpen, label: "Subjects", path: "/admin/subjects" },
        { icon: FileText, label: "Notices", path: "/admin/notices" },
        { icon: MessageSquare, label: "FAQs", path: "/admin/faqs" },
        { icon: Star, label: "Feedback", path: "/admin/feedback" },
        { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    ];

    if (!adminData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={`${sidebarOpen ? "w-64" : "w-20"
                    } bg-gradient-to-b from-blue-900 to-purple-900 transition-all duration-300 flex flex-col flex-shrink-0`}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    {sidebarOpen && (
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold">BMS Admin</h2>
                                <p className="text-blue-200 text-xs">College Portal</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? "bg-white/20 text-white shadow-lg"
                                        : "text-blue-200 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <IconComponent className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="font-medium">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div
                        className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"
                            }`}
                    >
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {adminData?.name?.charAt(0) || "A"}
                            </span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">
                                    {adminData?.name || "Admin"}
                                </p>
                                <p className="text-blue-200 text-xs">Administrator</p>
                            </div>
                        )}
                        {sidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="text-blue-200 hover:text-white transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {menuItems.find((m) => m.path === location.pathname)?.label || "Admin"}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Welcome back, {adminData?.name}! 👋
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Settings className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
