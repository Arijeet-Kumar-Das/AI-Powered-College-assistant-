// src/components/teacher/AttendanceManager.jsx
// Component for teachers to mark and manage student attendance

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Calendar,
    Users,
    Check,
    X,
    Clock,
    Save,
    Loader2,
    ChevronDown,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart2,
    History,
} from "lucide-react";

const AttendanceManager = ({ subjects }) => {
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [existingAttendance, setExistingAttendance] = useState(null);
    const [view, setView] = useState("mark"); // 'mark' or 'history'
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const token = localStorage.getItem("teacherToken");

    // Fetch students when subject changes
    useEffect(() => {
        if (selectedSubject) {
            fetchStudents();
            checkExistingAttendance();
        }
    }, [selectedSubject]);

    // Check existing attendance when date changes
    useEffect(() => {
        if (selectedSubject && selectedDate) {
            checkExistingAttendance();
        }
    }, [selectedDate]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/teacher/attendance/students/${selectedSubject}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setStudents(res.data.students);
                // Initialize attendance with all present
                const initial = {};
                res.data.students.forEach((s) => {
                    initial[s._id] = "present";
                });
                setAttendance(initial);
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to fetch students",
            });
        } finally {
            setLoading(false);
        }
    };

    const checkExistingAttendance = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/teacher/attendance/${selectedSubject}/${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success && res.data.attendance) {
                setExistingAttendance(res.data.attendance);
                // Load existing attendance data
                const existing = {};
                res.data.attendance.records.forEach((r) => {
                    existing[r.student._id || r.student] = r.status;
                });
                setAttendance(existing);
            } else {
                setExistingAttendance(null);
                // Reset to all present
                const initial = {};
                students.forEach((s) => {
                    initial[s._id] = "present";
                });
                setAttendance(initial);
            }
        } catch (error) {
            console.error("Error checking existing attendance:", error);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const markAllAs = (status) => {
        const updated = {};
        students.forEach((s) => {
            updated[s._id] = status;
        });
        setAttendance(updated);
    };

    const saveAttendance = async () => {
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                student: studentId,
                status,
            }));

            const res = await axios.post(
                "http://localhost:5000/api/teacher/attendance/mark",
                {
                    subjectCode: selectedSubject,
                    date: selectedDate,
                    records,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setMessage({
                    type: "success",
                    text: `Attendance saved! Present: ${res.data.attendance.totalPresent}, Absent: ${res.data.attendance.totalAbsent}, Late: ${res.data.attendance.totalLate}`,
                });
                setExistingAttendance(res.data.attendance);
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to save attendance",
            });
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        if (!selectedSubject) return;
        setHistoryLoading(true);

        try {
            const res = await axios.get(
                `http://localhost:5000/api/teacher/attendance/history/${selectedSubject}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setHistory(res.data.history);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (view === "history" && selectedSubject) {
            fetchHistory();
        }
    }, [view, selectedSubject]);

    const getStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case "absent":
                return <XCircle className="w-5 h-5 text-red-400" />;
            case "late":
                return <Clock className="w-5 h-5 text-yellow-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "present":
                return "bg-green-500/20 text-green-300 border-green-500/30";
            case "absent":
                return "bg-red-500/20 text-red-300 border-red-500/30";
            case "late":
                return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
            default:
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    // Calculate stats
    const stats = {
        total: students.length,
        present: Object.values(attendance).filter((s) => s === "present").length,
        absent: Object.values(attendance).filter((s) => s === "absent").length,
        late: Object.values(attendance).filter((s) => s === "late").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Calendar className="w-7 h-7 text-purple-400" />
                            Attendance Management
                        </h2>
                        <p className="text-purple-300 mt-1">
                            Mark and track student attendance
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView("mark")}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${view === "mark"
                                    ? "bg-purple-500 text-white"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            <Check className="w-4 h-4 inline mr-2" />
                            Mark Attendance
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${view === "history"
                                    ? "bg-purple-500 text-white"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            <History className="w-4 h-4 inline mr-2" />
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Subject & Date Selection */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subject Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Select Subject
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="" className="bg-slate-800">
                                    Choose a subject...
                                </option>
                                {subjects.map((sub) => (
                                    <option
                                        key={sub.subjectCode}
                                        value={sub.subjectCode}
                                        className="bg-slate-800"
                                    >
                                        {sub.subjectCode} - {sub.subjectName}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {existingAttendance && (
                    <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-200 text-sm">
                            Attendance already marked for this date. You can update it.
                        </span>
                    </div>
                )}
            </div>

            {/* Message */}
            {message.text && (
                <div
                    className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-500/20 border border-green-500/30 text-green-300"
                            : "bg-red-500/20 border border-red-500/30 text-red-300"
                        }`}
                >
                    {message.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {view === "mark" && (
                <>
                    {/* Quick Actions & Stats */}
                    {selectedSubject && students.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Quick Mark Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => markAllAs("present")}
                                        className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-all"
                                    >
                                        <Check className="w-4 h-4 inline mr-1" /> All Present
                                    </button>
                                    <button
                                        onClick={() => markAllAs("absent")}
                                        className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                                    >
                                        <X className="w-4 h-4 inline mr-1" /> All Absent
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {stats.total}
                                        </p>
                                        <p className="text-xs text-purple-300">Total</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-400">
                                            {stats.present}
                                        </p>
                                        <p className="text-xs text-green-300">Present</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">
                                            {stats.absent}
                                        </p>
                                        <p className="text-xs text-red-300">Absent</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-yellow-400">
                                            {stats.late}
                                        </p>
                                        <p className="text-xs text-yellow-300">Late</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Students List */}
                    {loading ? (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        </div>
                    ) : selectedSubject && students.length > 0 ? (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    Students ({students.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-white/10">
                                {students.map((student) => (
                                    <div
                                        key={student._id}
                                        className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                                                {student.name?.charAt(0) || "S"}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{student.name}</p>
                                                <p className="text-purple-300 text-sm">
                                                    {student.usn}
                                                    {student.section && ` • Section ${student.section}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Buttons */}
                                        <div className="flex gap-2">
                                            {["present", "absent", "late"].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() =>
                                                        handleStatusChange(student._id, status)
                                                    }
                                                    className={`px-3 py-2 rounded-lg border transition-all capitalize ${attendance[student._id] === status
                                                            ? getStatusColor(status)
                                                            : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                                                        }`}
                                                >
                                                    {status === "present" && (
                                                        <Check className="w-4 h-4 inline mr-1" />
                                                    )}
                                                    {status === "absent" && (
                                                        <X className="w-4 h-4 inline mr-1" />
                                                    )}
                                                    {status === "late" && (
                                                        <Clock className="w-4 h-4 inline mr-1" />
                                                    )}
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Save Button */}
                            <div className="p-4 border-t border-white/10 bg-white/5">
                                <button
                                    onClick={saveAttendance}
                                    disabled={saving}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Attendance
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : selectedSubject ? (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
                            <Users className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                            <p className="text-white/70">No students found for this subject</p>
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
                            <Calendar className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                            <p className="text-white/70">Select a subject to mark attendance</p>
                        </div>
                    )}
                </>
            )}

            {/* History View */}
            {view === "history" && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-purple-400" />
                            Attendance History
                        </h3>
                    </div>

                    {historyLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        </div>
                    ) : history.length > 0 ? (
                        <div className="divide-y divide-white/10">
                            {history.map((record) => (
                                <div
                                    key={record._id}
                                    className="p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">
                                                {new Date(record.date).toLocaleDateString("en-IN", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="text-purple-300 text-sm">
                                                {record.subjectCode}
                                                {record.section && ` • Section ${record.section}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-green-400">
                                                    {record.totalPresent}
                                                </p>
                                                <p className="text-xs text-green-300">Present</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-red-400">
                                                    {record.totalAbsent}
                                                </p>
                                                <p className="text-xs text-red-300">Absent</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-yellow-400">
                                                    {record.totalLate}
                                                </p>
                                                <p className="text-xs text-yellow-300">Late</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : selectedSubject ? (
                        <div className="p-12 text-center">
                            <History className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                            <p className="text-white/70">No attendance history found</p>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                            <p className="text-white/70">Select a subject to view history</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceManager;
