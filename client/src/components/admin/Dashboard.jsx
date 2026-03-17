// src/components/admin/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Activity,
  Bell,
  FileText,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  LogOut,
  Settings,
  Search,
  Plus,
  Menu,
  X,
  Star,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    // Get admin data from localStorage
    const admin = JSON.parse(localStorage.getItem("adminData"));
    if (!admin) {
      navigate("/login/admin");
    } else {
      setAdminData(admin);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/login/admin");
  };

  // Stats data
  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: "2,845",
      change: "+12%",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: GraduationCap,
      label: "Faculty Members",
      value: "156",
      change: "+3%",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: MessageSquare,
      label: "Chat Sessions",
      value: "8,429",
      change: "+24%",
      color: "from-green-500 to-teal-500",
      bgColor: "bg-green-50",
    },
    {
      icon: BookOpen,
      label: "Active Courses",
      value: "48",
      change: "+5%",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      user: "John Doe",
      action: "uploaded marks for CS301",
      time: "5 min ago",
      avatar: "JD",
    },
    {
      user: "Sarah Smith",
      action: "created new notice",
      time: "15 min ago",
      avatar: "SS",
    },
    {
      user: "Mike Johnson",
      action: "added new student",
      time: "1 hour ago",
      avatar: "MJ",
    },
    {
      user: "Emma Wilson",
      action: "updated FAQ section",
      time: "2 hours ago",
      avatar: "EW",
    },
  ];

  const menuItems = [
    {
      icon: Activity,
      label: "Dashboard",
      path: "/admin/dashboard",
      active: true,
    },
    { icon: Users, label: "Students", path: "/admin/students" },
    { icon: GraduationCap, label: "Teachers", path: "/admin/teachers" },
    { icon: BookOpen, label: "Subjects", path: "/admin/subjects" },
    { icon: FileText, label: "Notices", path: "/admin/notices" },
    { icon: MessageSquare, label: "FAQs", path: "/admin/faqs" },
    { icon: Star, label: "Feedback", path: "/admin/feedback" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-gradient-to-b from-blue-900 to-purple-900 transition-all duration-300 flex flex-col`}
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
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${item.active
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
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {adminData?.name}! 👋
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                        style={{
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      />
                    </div>
                    <span className="text-green-600 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-3xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Activity Overview
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Last 7 days performance
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600">Chart visualization here</p>
                  <p className="text-sm text-gray-500">
                    Integrate with Chart.js or Recharts
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {activity.avatar}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-gray-600">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
                View All Activities
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-left">
                <h4 className="font-bold text-lg mb-2">Add Student</h4>
                <p className="text-blue-100 text-sm">Register new student</p>
              </div>
              <Plus className="w-8 h-8" />
            </button>

            <button className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-left">
                <h4 className="font-bold text-lg mb-2">Add Teacher</h4>
                <p className="text-green-100 text-sm">Register new faculty</p>
              </div>
              <Plus className="w-8 h-8" />
            </button>

            <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-left">
                <h4 className="font-bold text-lg mb-2">Create Notice</h4>
                <p className="text-orange-100 text-sm">Post announcement</p>
              </div>
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
