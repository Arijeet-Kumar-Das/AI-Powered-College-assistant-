// src/components/student/AttendanceView.jsx
// Component for students to view their attendance

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    BarChart2,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

const AttendanceView = () => {
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem("studentToken");
            const res = await axios.get(
                "http://localhost:5000/api/student/attendance/my-attendance",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setAttendance(res.data.attendance);
                setSummary(res.data.summary);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch attendance");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case "absent":
                return <XCircle className="w-4 h-4 text-red-400" />;
            case "late":
                return <Clock className="w-4 h-4 text-yellow-400" />;
            default:
                return null;
        }
    };

    const getPercentageColor = (percentage) => {
        if (percentage >= 75) return "text-green-400";
        if (percentage >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    const getPercentageBg = (percentage) => {
        if (percentage >= 75) return "bg-green-500";
        if (percentage >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Calendar className="w-7 h-7 text-purple-400" />
                    My Attendance
                </h2>
                <p className="text-purple-300 mt-1">
                    Track your class attendance across all subjects
                </p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            {summary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.map((sub) => (
                        <div
                            key={sub.subjectCode}
                            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-semibold">{sub.subjectCode}</h3>
                                    <p className="text-purple-300 text-sm">
                                        {sub.totalClasses} classes
                                    </p>
                                </div>
                                <div
                                    className={`text-3xl font-bold ${getPercentageColor(
                                        sub.percentage
                                    )}`}
                                >
                                    {sub.percentage}%
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                <div
                                    className={`h-full ${getPercentageBg(sub.percentage)} transition-all`}
                                    style={{ width: `${sub.percentage}%` }}
                                />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-green-500/20 rounded-lg p-2">
                                    <p className="text-lg font-bold text-green-400">{sub.present}</p>
                                    <p className="text-xs text-green-300">Present</p>
                                </div>
                                <div className="bg-red-500/20 rounded-lg p-2">
                                    <p className="text-lg font-bold text-red-400">{sub.absent}</p>
                                    <p className="text-xs text-red-300">Absent</p>
                                </div>
                                <div className="bg-yellow-500/20 rounded-lg p-2">
                                    <p className="text-lg font-bold text-yellow-400">{sub.late}</p>
                                    <p className="text-xs text-yellow-300">Late</p>
                                </div>
                            </div>

                            {/* Warning if below 75% */}
                            {sub.percentage < 75 && (
                                <div className="mt-4 p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Below 75% required attendance
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
                    <Calendar className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                    <p className="text-white/70 text-lg">No attendance records found</p>
                    <p className="text-purple-300 text-sm mt-2">
                        Your attendance will appear here once your teachers mark it
                    </p>
                </div>
            )}

            {/* Recent Attendance Records */}
            {attendance.length > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-purple-400" />
                            Recent Records
                        </h3>
                    </div>

                    <div className="divide-y divide-white/10 max-h-80 overflow-y-auto">
                        {attendance.slice(0, 20).map((record, idx) => (
                            <div
                                key={idx}
                                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.status === "present"
                                                ? "bg-green-500/20"
                                                : record.status === "absent"
                                                    ? "bg-red-500/20"
                                                    : "bg-yellow-500/20"
                                            }`}
                                    >
                                        {getStatusIcon(record.status)}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{record.subjectCode}</p>
                                        <p className="text-purple-300 text-sm">
                                            {new Date(record.date).toLocaleDateString("en-IN", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${record.status === "present"
                                            ? "bg-green-500/20 text-green-300"
                                            : record.status === "absent"
                                                ? "bg-red-500/20 text-red-300"
                                                : "bg-yellow-500/20 text-yellow-300"
                                        }`}
                                >
                                    {record.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceView;
