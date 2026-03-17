// src/components/teacher/MarksManager.jsx
// Marks entry component with subject-aware forms and attendance eligibility check

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Users,
    Save,
    AlertCircle,
    CheckCircle,
    Search,
    RefreshCw,
    ChevronDown,
    Calculator,
    AlertTriangle,
    XCircle,
} from "lucide-react";

const MarksManager = ({ subjects }) => {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [marksData, setMarksData] = useState({});
    const [minimumAttendance, setMinimumAttendance] = useState(75);

    // Fetch students when subject changes
    useEffect(() => {
        if (selectedSubject) {
            fetchStudents(selectedSubject.subjectCode);
        }
    }, [selectedSubject]);

    const fetchStudents = async (subjectCode) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("teacherToken");
            const response = await fetch(
                `http://localhost:5000/api/teacher/students/${subjectCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();

            if (data.success) {
                setStudents(data.students);
                setMinimumAttendance(data.minimumAttendance || 75);

                // Determine subject type for proper conversion
                const subjectType = data.subject?.subjectType || selectedSubject?.subjectType;
                const isIntegrated = subjectType === "integrated";

                // Initialize marks data from existing marks
                // IMPORTANT: Convert stored values back to input scale for display
                const initialMarks = {};
                data.students.forEach((student) => {
                    if (student.marks) {
                        // SEE is stored as /50, display as /100
                        const seeDisplay = (student.marks.seeMarks || 0) * 2;

                        // For non-integrated: CIE stored as /20, display as /40
                        // For integrated: CIE stored as-is
                        let cie1Display, cie2Display;
                        if (isIntegrated) {
                            cie1Display = student.marks.cie1 || 0;
                            cie2Display = student.marks.cie2 || 0;
                        } else {
                            cie1Display = (student.marks.cie1 || 0) * 2;
                            cie2Display = (student.marks.cie2 || 0) * 2;
                        }

                        initialMarks[student._id] = {
                            cie1: cie1Display,
                            cie2: cie2Display,
                            aat: student.marks.aat || 0,
                            lab: student.marks.lab || 0,
                            see: seeDisplay,
                        };
                    } else {
                        initialMarks[student._id] = { cie1: 0, cie2: 0, aat: 0, lab: 0, see: 0 };
                    }
                });
                setMarksData(initialMarks);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to fetch students" });
        } finally {
            setLoading(false);
        }
    };

    const handleMarksChange = (studentId, field, value) => {
        const student = students.find(s => s._id === studentId);
        const isIntegrated = selectedSubject?.subjectType === "integrated";

        // Block SEE entry for ineligible students (attendance)
        if (field === "see" && student && !student.seeEligible && student.attendance?.hasRecords) {
            setMessage({
                type: "error",
                text: `Cannot enter SEE marks for ${student.name}. Attendance: ${student.attendance.percentage}% (min ${minimumAttendance}% required)`
            });
            return;
        }

        // Block SEE entry if CIE total < 25
        if (field === "see" && parseFloat(value) > 0) {
            const cieTotal = calculateCIETotal(studentId);
            if (cieTotal < 25) {
                setMessage({
                    type: "error",
                    text: `Cannot enter SEE marks for ${student?.name || 'student'}. CIE total is ${cieTotal} (minimum 25 required)`
                });
                return;
            }
        }

        // Validate max values based on subject type
        let maxValue;
        if (field === "cie1" || field === "cie2") {
            maxValue = isIntegrated ? 10 : 40;
        } else if (field === "aat") {
            maxValue = 10;
        } else if (field === "lab") {
            maxValue = 20;
        } else if (field === "see") {
            maxValue = 100;
        }

        const numValue = Math.min(Math.max(0, parseFloat(value) || 0), maxValue);

        setMarksData((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: numValue,
            },
        }));
    };

    const calculateCIETotal = (studentId) => {
        const marks = marksData[studentId] || {};
        const isIntegrated = selectedSubject?.subjectType === "integrated";

        if (isIntegrated) {
            // Integrated: cie1 + cie2 + aat + lab (all stored as-is)
            return (marks.cie1 || 0) + (marks.cie2 || 0) + (marks.aat || 0) + (marks.lab || 0);
        } else {
            // Non-integrated: cie1/2 + cie2/2 + aat
            return Math.round((marks.cie1 || 0) / 2) + Math.round((marks.cie2 || 0) / 2) + (marks.aat || 0);
        }
    };

    const calculateTotal = (studentId) => {
        const marks = marksData[studentId] || {};
        const cieTotal = calculateCIETotal(studentId);
        const seeStored = Math.round((marks.see || 0) / 2);
        return cieTotal + seeStored;
    };

    const saveAllMarks = async () => {
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const token = localStorage.getItem("teacherToken");
            const studentsMarks = Object.entries(marksData).map(([studentId, marks]) => ({
                studentId,
                marks: {
                    cie1: marks.cie1,
                    cie2: marks.cie2,
                    aat: marks.aat,
                    lab: marks.lab,
                    see: marks.see,
                    academicYear: new Date().getFullYear().toString(),
                },
            }));

            const response = await fetch("http://localhost:5000/api/teacher/marks/bulk", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectCode: selectedSubject.subjectCode,
                    studentsMarks,
                }),
            });

            const data = await response.json();

            if (data.success) {
                let messageText = `Marks saved for ${data.summary?.successful || 0} students`;
                if (data.summary?.ineligible > 0) {
                    messageText += `. ${data.summary.ineligible} student(s) skipped due to low attendance.`;
                }
                setMessage({
                    type: data.summary?.ineligible > 0 ? "warning" : "success",
                    text: messageText,
                });

                // Refresh students to get updated data
                fetchStudents(selectedSubject.subjectCode);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to save marks" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save marks" });
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.usn.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isIntegrated = selectedSubject?.subjectType === "integrated";
    const ineligibleCount = students.filter(s => !s.seeEligible && s.attendance?.hasRecords).length;

    return (
        <div className="space-y-6">
            {/* Subject Selector */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-white/60 text-sm mb-2">Select Subject</label>
                        <div className="relative">
                            <select
                                value={selectedSubject?.subjectCode || ""}
                                onChange={(e) => {
                                    const subject = subjects.find((s) => s.subjectCode === e.target.value);
                                    setSelectedSubject(subject);
                                }}
                                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="" className="bg-slate-800">Choose a subject...</option>
                                {subjects.map((subject) => (
                                    <option key={subject.subjectCode} value={subject.subjectCode} className="bg-slate-800">
                                        {subject.subjectCode} - {subject.subjectName}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                        </div>
                    </div>

                    {selectedSubject && (
                        <div className="flex items-center gap-4">
                            <span
                                className={`px-4 py-2 rounded-xl text-sm font-medium ${isIntegrated
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    }`}
                            >
                                {isIntegrated ? "Integrated" : "Non-Integrated"}
                            </span>
                            <div className="text-white/60 text-sm">
                                Sem {selectedSubject.semester}
                            </div>
                        </div>
                    )}
                </div>

                {/* Marking Schema Info */}
                {selectedSubject && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                        <div className="flex items-center gap-2 text-purple-300 mb-2">
                            <Calculator className="w-4 h-4" />
                            <span className="font-medium text-sm">Marking Schema</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-white/60">
                            <div>
                                <span className="text-white">CIE 1:</span> {isIntegrated ? "/10" : "/40 → /20"}
                            </div>
                            <div>
                                <span className="text-white">CIE 2:</span> {isIntegrated ? "/10" : "/40 → /20"}
                            </div>
                            <div>
                                <span className="text-white">AAT:</span> /10
                            </div>
                            {isIntegrated && (
                                <div>
                                    <span className="text-white">Lab:</span> /20
                                </div>
                            )}
                            <div>
                                <span className="text-white">SEE:</span> /100 → /50
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Ineligible Students Warning */}
                {selectedSubject && ineligibleCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 p-4 bg-red-500/20 rounded-xl border border-red-500/30 flex items-center gap-3"
                    >
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="text-red-300 text-sm">
                            <strong>{ineligibleCount} student(s)</strong> have attendance below {minimumAttendance}%.
                            SEE marks cannot be entered for them.
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Students Table */}
            {selectedSubject && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                >
                    {/* Table Header */}
                    <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-medium">
                                {students.length} Students
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
                                />
                            </div>

                            <button
                                onClick={() => fetchStudents(selectedSubject.subjectCode)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-all"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                            </button>

                            <button
                                onClick={saveAllMarks}
                                disabled={saving || students.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Saving..." : "Save All"}
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`px-4 py-3 flex items-center gap-2 ${message.type === "success"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : message.type === "warning"
                                        ? "bg-yellow-500/20 text-yellow-300"
                                        : "bg-red-500/20 text-red-300"
                                    }`}
                            >
                                {message.type === "success" ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : message.type === "warning" ? (
                                    <AlertTriangle className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-white/40">
                                <Users className="w-12 h-12 mb-3" />
                                <p>No students found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-white/60 text-sm font-medium">USN</th>
                                        <th className="text-left px-4 py-3 text-white/60 text-sm font-medium">Name</th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            Attend.<br /><span className="text-xs">(%)</span>
                                        </th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            CIE 1<br /><span className="text-xs">({isIntegrated ? "10" : "40"})</span>
                                        </th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            CIE 2<br /><span className="text-xs">({isIntegrated ? "10" : "40"})</span>
                                        </th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            AAT<br /><span className="text-xs">(10)</span>
                                        </th>
                                        {isIntegrated && (
                                            <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                                Lab<br /><span className="text-xs">(20)</span>
                                            </th>
                                        )}
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            SEE<br /><span className="text-xs">(100)</span>
                                        </th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            CIE Total<br /><span className="text-xs">(50)</span>
                                        </th>
                                        <th className="text-center px-4 py-3 text-white/60 text-sm font-medium">
                                            Total<br /><span className="text-xs">(100)</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, idx) => {
                                        const isSEEEligible = student.seeEligible || !student.attendance?.hasRecords;
                                        const attendancePercent = student.attendance?.percentage ?? "-";

                                        return (
                                            <motion.tr
                                                key={student._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className={`border-t border-white/5 hover:bg-white/5 ${!isSEEEligible ? "bg-red-500/5" : ""}`}
                                            >
                                                <td className="px-4 py-3 text-purple-300 font-mono text-sm">{student.usn}</td>
                                                <td className="px-4 py-3 text-white text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {student.name}
                                                        {!isSEEEligible && (
                                                            <span title={`Attendance: ${attendancePercent}% (Below ${minimumAttendance}%)`}>
                                                                <XCircle className="w-4 h-4 text-red-400" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <span className={`text-sm font-medium ${attendancePercent === "-" ? "text-white/40" :
                                                        attendancePercent >= minimumAttendance ? "text-green-400" : "text-red-400"
                                                        }`}>
                                                        {attendancePercent}{attendancePercent !== "-" ? "%" : ""}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={isIntegrated ? 10 : 40}
                                                        value={marksData[student._id]?.cie1 || ""}
                                                        onChange={(e) => handleMarksChange(student._id, "cie1", e.target.value)}
                                                        className="w-16 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={isIntegrated ? 10 : 40}
                                                        value={marksData[student._id]?.cie2 || ""}
                                                        onChange={(e) => handleMarksChange(student._id, "cie2", e.target.value)}
                                                        className="w-16 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={marksData[student._id]?.aat || ""}
                                                        onChange={(e) => handleMarksChange(student._id, "aat", e.target.value)}
                                                        className="w-16 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                {isIntegrated && (
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="20"
                                                            value={marksData[student._id]?.lab || ""}
                                                            onChange={(e) => handleMarksChange(student._id, "lab", e.target.value)}
                                                            className="w-16 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        disabled={!isSEEEligible}
                                                        value={marksData[student._id]?.see || ""}
                                                        onChange={(e) => handleMarksChange(student._id, "see", e.target.value)}
                                                        title={!isSEEEligible ? `Cannot enter SEE - ${attendancePercent}% attendance (min ${minimumAttendance}%)` : ""}
                                                        className={`w-16 bg-white/10 border rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isSEEEligible
                                                            ? "border-red-500/50 text-red-300 cursor-not-allowed opacity-50"
                                                            : "border-white/10 text-white"
                                                            }`}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-emerald-400 font-medium">
                                                        {calculateCIETotal(student._id)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-amber-400 font-bold">
                                                        {calculateTotal(student._id)}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Empty State */}
            {!selectedSubject && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-white/40"
                >
                    <BookOpen className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-medium text-white/60 mb-2">Select a Subject</h3>
                    <p className="text-sm">Choose a subject from the dropdown to manage student marks</p>
                </motion.div>
            )}
        </div>
    );
};

export default MarksManager;
