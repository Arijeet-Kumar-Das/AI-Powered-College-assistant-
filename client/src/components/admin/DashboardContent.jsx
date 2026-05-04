// src/components/admin/DashboardContent.jsx
// Dashboard stats and overview content (rendered inside AdminLayout)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import {
    Users,
    GraduationCap,
    BookOpen,
    Layers,
    BarChart3,
    Plus,
    Loader2,
} from "lucide-react";

const DashboardContent = () => {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const admin = JSON.parse(localStorage.getItem("adminData"));
        setAdminData(admin);
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await API.get("/api/admin/dashboard/stats");

            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Stats cards config
    const statCards = [
        {
            icon: Users,
            label: "Total Students",
            value: stats?.totalStudents || 0,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            icon: GraduationCap,
            label: "Faculty Members",
            value: stats?.totalTeachers || 0,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
        },
        {
            icon: BookOpen,
            label: "Total Subjects",
            value: stats?.totalSubjects || 0,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            icon: Layers,
            label: "Active Courses",
            value: stats?.totalCourses || 0,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
        },
    ];

    const recentActivities = [
        { user: "System", action: "Dashboard loaded", time: "Just now", avatar: "SY" },
        { user: "Admin", action: "Stats refreshed", time: "1 min ago", avatar: "AD" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
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
                                    <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                            <p className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
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
                            <h3 className="text-xl font-bold text-gray-800">System Overview</h3>
                            <p className="text-gray-600 text-sm">Real-time statistics</p>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                            <p className="text-blue-600 text-sm font-medium">Students</p>
                            <p className="text-2xl font-bold text-blue-800">{stats?.totalStudents || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                            <p className="text-purple-600 text-sm font-medium">Teachers</p>
                            <p className="text-2xl font-bold text-purple-800">{stats?.totalTeachers || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                            <p className="text-green-600 text-sm font-medium">Subjects</p>
                            <p className="text-2xl font-bold text-green-800">{stats?.totalSubjects || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                            <p className="text-orange-600 text-sm font-medium">Courses</p>
                            <p className="text-2xl font-bold text-orange-800">{stats?.totalCourses || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Total Users</span>
                            <span className="font-bold text-gray-800">
                                {(stats?.totalStudents || 0) + (stats?.totalTeachers || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Students</span>
                            <span className="font-bold text-blue-600">{stats?.totalStudents || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Faculty</span>
                            <span className="font-bold text-purple-600">{stats?.totalTeachers || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Subjects</span>
                            <span className="font-bold text-green-600">{stats?.totalSubjects || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => navigate("/admin/students")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                    <div className="text-left">
                        <h4 className="font-bold text-lg mb-2">Add Student</h4>
                        <p className="text-blue-100 text-sm">Register new student</p>
                    </div>
                    <Plus className="w-8 h-8" />
                </button>

                <button
                    onClick={() => navigate("/admin/teachers")}
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                    <div className="text-left">
                        <h4 className="font-bold text-lg mb-2">Add Teacher</h4>
                        <p className="text-green-100 text-sm">Register new faculty</p>
                    </div>
                    <Plus className="w-8 h-8" />
                </button>

                <button
                    onClick={() => navigate("/admin/notices")}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                    <div className="text-left">
                        <h4 className="font-bold text-lg mb-2">Create Notice</h4>
                        <p className="text-orange-100 text-sm">Post announcement</p>
                    </div>
                    <Plus className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

export default DashboardContent;
