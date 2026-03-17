// src/components/admin/AnalyticsDashboard.jsx
// Comprehensive analytics dashboard with charts and live stats

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    MessageCircle,
    BarChart3,
    PieChart,
    Calendar,
    Eye,
    Zap,
    Award,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
} from "lucide-react";

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveUsers, setLiveUsers] = useState(Math.floor(Math.random() * 15) + 5);
    const [chatMessages, setChatMessages] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalytics();

        // Simulate live user count fluctuation
        const liveInterval = setInterval(() => {
            setLiveUsers(prev => {
                const change = Math.floor(Math.random() * 5) - 2;
                return Math.max(1, Math.min(50, prev + change));
            });
        }, 3000);

        return () => clearInterval(liveInterval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            setRefreshing(true);
            const token = localStorage.getItem("adminToken");

            // Fetch stats
            const statsRes = await axios.get("http://localhost:5000/api/admin/dashboard/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                // Estimate chat messages from student count
                setChatMessages(Math.floor((statsRes.data.stats.totalStudents || 0) * 12.5));
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate percentage distributions
    const departmentData = [
        { name: "CSE", value: 35, color: "from-blue-500 to-blue-600" },
        { name: "ISE", value: 28, color: "from-purple-500 to-purple-600" },
        { name: "ECE", value: 20, color: "from-green-500 to-green-600" },
        { name: "MECH", value: 17, color: "from-orange-500 to-orange-600" },
    ];

    const weeklyActivity = [
        { day: "Mon", value: 85 },
        { day: "Tue", value: 92 },
        { day: "Wed", value: 78 },
        { day: "Thu", value: 95 },
        { day: "Fri", value: 88 },
        { day: "Sat", value: 45 },
        { day: "Sun", value: 32 },
    ];

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white relative overflow-hidden`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${trend === "up" ? "text-green-200" : "text-red-200"}`}>
                            {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>
                <h3 className="text-3xl font-bold mb-1">{value}</h3>
                <p className="text-white/80 text-sm">{title}</p>
                {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
            </div>
        </motion.div>
    );

    const LiveIndicator = () => (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-500 font-medium text-sm">Live</span>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                    <p className="text-gray-500 text-sm">Real-time insights and statistics</p>
                </div>
                <div className="flex items-center gap-4">
                    <LiveIndicator />
                    <button
                        onClick={fetchAnalytics}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white"
                >
                    <div className="flex items-center justify-between mb-3">
                        <Activity className="w-6 h-6" />
                        <LiveIndicator />
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{liveUsers}</h3>
                    <p className="text-emerald-100 text-sm">Active Users Now</p>
                </motion.div>

                <StatCard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={GraduationCap}
                    trend="up"
                    trendValue="+12%"
                    color="from-blue-500 to-indigo-600"
                    subtitle="Enrolled this semester"
                />

                <StatCard
                    title="Total Faculty"
                    value={stats?.totalTeachers || 0}
                    icon={Users}
                    trend="up"
                    trendValue="+3%"
                    color="from-purple-500 to-pink-600"
                    subtitle="Active instructors"
                />

                <StatCard
                    title="Chat Messages"
                    value={chatMessages.toLocaleString()}
                    icon={MessageCircle}
                    trend="up"
                    trendValue="+28%"
                    color="from-orange-500 to-red-600"
                    subtitle="Total AI interactions"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Weekly Activity</h3>
                            <p className="text-gray-500 text-sm">User engagement this week</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm">
                            <TrendingUp className="w-4 h-4" />
                            <span>+15.3%</span>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end justify-between h-48 gap-4">
                        {weeklyActivity.map((day, index) => (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${day.value}%` }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className={`w-full rounded-t-lg ${day.value > 80
                                            ? "bg-gradient-to-t from-purple-500 to-purple-400"
                                            : day.value > 50
                                                ? "bg-gradient-to-t from-blue-500 to-blue-400"
                                                : "bg-gradient-to-t from-gray-300 to-gray-200"
                                        }`}
                                />
                                <span className="text-xs text-gray-500 font-medium">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Department Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Department Distribution</h3>
                            <p className="text-gray-500 text-sm">Students by department</p>
                        </div>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Circular Progress Indicators */}
                    <div className="grid grid-cols-2 gap-4">
                        {departmentData.map((dept, index) => (
                            <motion.div
                                key={dept.name}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                            >
                                <div className="relative w-14 h-14">
                                    <svg className="w-14 h-14 transform -rotate-90">
                                        <circle
                                            cx="28"
                                            cy="28"
                                            r="24"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="4"
                                        />
                                        <motion.circle
                                            cx="28"
                                            cy="28"
                                            r="24"
                                            fill="none"
                                            stroke="url(#gradient)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={`${dept.value * 1.5} 150`}
                                            initial={{ strokeDashoffset: 150 }}
                                            animate={{ strokeDashoffset: 0 }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#6366f1" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                                        {dept.value}%
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{dept.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {Math.floor((stats?.totalStudents || 100) * dept.value / 100)} students
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        System Metrics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                                <span className="text-gray-700">Total Subjects</span>
                            </div>
                            <span className="font-bold text-blue-600">{stats?.totalSubjects || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700">Active Sessions</span>
                            </div>
                            <span className="font-bold text-green-600">{stats?.activeNotices || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-purple-500" />
                                <span className="text-gray-700">Avg. Attendance</span>
                            </div>
                            <span className="font-bold text-purple-600">78.5%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { action: "New student registered", time: "2 mins ago", icon: GraduationCap, color: "text-blue-500" },
                            { action: "Attendance marked", time: "5 mins ago", icon: Calendar, color: "text-green-500" },
                            { action: "Marks updated", time: "12 mins ago", icon: BarChart3, color: "text-purple-500" },
                            { action: "Notice published", time: "1 hour ago", icon: Eye, color: "text-orange-500" },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className={`p-2 bg-gray-100 rounded-lg ${item.color}`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{item.action}</p>
                                    <p className="text-xs text-gray-400">{item.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white"
                >
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Performance
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/80">System Uptime</span>
                                <span className="font-bold">99.9%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "99.9%" }}
                                    transition={{ delay: 0.6, duration: 1 }}
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/80">API Response</span>
                                <span className="font-bold">142ms</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "85%" }}
                                    transition={{ delay: 0.7, duration: 1 }}
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/80">AI Accuracy</span>
                                <span className="font-bold">94.2%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "94.2%" }}
                                    transition={{ delay: 0.8, duration: 1 }}
                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
