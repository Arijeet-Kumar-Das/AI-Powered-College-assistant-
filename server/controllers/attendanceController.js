// controllers/attendanceController.js
// Handles attendance marking and retrieval

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

// ==================== TEACHER APIs ====================

// Get students for a subject (for attendance marking)
exports.getStudentsForSubject = async (req, res) => {
    try {
        const { subjectCode } = req.params;
        const teacherId = req.teacher._id;

        // Verify teacher is assigned to this subject
        const teacher = await Teacher.findById(teacherId).lean();
        const isAssigned = teacher.subjectsAssigned?.some(
            s => s.subjectCode === subjectCode
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject",
            });
        }

        // Get subject details
        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        // Get students in the same department and semester
        const students = await Student.find({
            department: subject.department,
            semester: subject.semester,
        })
            .select("usn name email section")
            .sort({ usn: 1 })
            .lean();

        res.json({
            success: true,
            subject: {
                code: subject.subjectCode,
                name: subject.subjectName,
                department: subject.department,
                semester: subject.semester,
            },
            students,
            count: students.length,
        });
    } catch (error) {
        console.error("Get students error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Mark attendance for a subject
exports.markAttendance = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        const { subjectCode, date, section, records } = req.body;

        // Verify teacher is assigned to this subject
        const teacher = await Teacher.findById(teacherId).lean();
        const isAssigned = teacher.subjectsAssigned?.some(
            s => s.subjectCode === subjectCode
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject",
            });
        }

        // Get subject details
        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance already exists for this date/subject/section
        let attendance = await Attendance.findOne({
            date: attendanceDate,
            subjectCode,
            section: section || null,
        });

        if (attendance) {
            // Update existing attendance
            attendance.records = records;
            attendance.teacher = teacherId;
            await attendance.save();
        } else {
            // Create new attendance
            attendance = new Attendance({
                date: attendanceDate,
                subject: subject._id,
                subjectCode: subject.subjectCode,
                teacher: teacherId,
                department: subject.department,
                semester: subject.semester,
                section: section || null,
                records,
            });
            await attendance.save();
        }

        res.json({
            success: true,
            message: "Attendance marked successfully",
            attendance: {
                date: attendance.date,
                subjectCode: attendance.subjectCode,
                totalPresent: attendance.totalPresent,
                totalAbsent: attendance.totalAbsent,
                totalLate: attendance.totalLate,
            },
        });
    } catch (error) {
        console.error("Mark attendance error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Attendance already marked for this date and subject",
            });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get attendance history for a subject
exports.getAttendanceHistory = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        const { subjectCode } = req.params;
        const { startDate, endDate, section } = req.query;

        // Verify teacher is assigned to this subject
        const teacher = await Teacher.findById(teacherId).lean();
        const isAssigned = teacher.subjectsAssigned?.some(
            s => s.subjectCode === subjectCode
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject",
            });
        }

        // Build query
        let query = { subjectCode };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        if (section) {
            query.section = section;
        }

        const history = await Attendance.find(query)
            .populate("records.student", "usn name")
            .sort({ date: -1 })
            .lean();

        res.json({
            success: true,
            history,
            count: history.length,
        });
    } catch (error) {
        console.error("Get attendance history error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get attendance for a specific date
exports.getAttendanceByDate = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        const { subjectCode, date } = req.params;

        // Verify teacher is assigned to this subject
        const teacher = await Teacher.findById(teacherId).lean();
        const isAssigned = teacher.subjectsAssigned?.some(
            s => s.subjectCode === subjectCode
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject",
            });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            subjectCode,
            date: attendanceDate,
        })
            .populate("records.student", "usn name section")
            .lean();

        if (!attendance) {
            return res.json({
                success: true,
                attendance: null,
                message: "No attendance record for this date",
            });
        }

        res.json({
            success: true,
            attendance,
        });
    } catch (error) {
        console.error("Get attendance by date error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==================== STUDENT API ====================

// Get student's own attendance
exports.getMyAttendance = async (req, res) => {
    try {
        const studentId = req.student._id;

        // Get all attendance records where this student is included
        const attendanceRecords = await Attendance.find({
            "records.student": studentId,
        })
            .select("date subjectCode records totalPresent totalAbsent")
            .sort({ date: -1 })
            .lean();

        // Process to get student-specific data
        const myAttendance = attendanceRecords.map(att => {
            const myRecord = att.records.find(
                r => r.student.toString() === studentId.toString()
            );
            return {
                date: att.date,
                subjectCode: att.subjectCode,
                status: myRecord?.status || "unknown",
            };
        });

        // Calculate attendance percentage per subject
        const subjectStats = {};
        myAttendance.forEach(att => {
            if (!subjectStats[att.subjectCode]) {
                subjectStats[att.subjectCode] = { present: 0, absent: 0, late: 0, total: 0 };
            }
            subjectStats[att.subjectCode].total++;
            if (att.status === "present") subjectStats[att.subjectCode].present++;
            else if (att.status === "absent") subjectStats[att.subjectCode].absent++;
            else if (att.status === "late") subjectStats[att.subjectCode].late++;
        });

        // Calculate percentages
        const summary = Object.entries(subjectStats).map(([code, stats]) => ({
            subjectCode: code,
            totalClasses: stats.total,
            present: stats.present,
            absent: stats.absent,
            late: stats.late,
            percentage: stats.total > 0
                ? Math.round(((stats.present + stats.late) / stats.total) * 100)
                : 0,
        }));

        res.json({
            success: true,
            attendance: myAttendance,
            summary,
        });
    } catch (error) {
        console.error("Get my attendance error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==================== ADMIN API ====================

// Get attendance report for admin
exports.getAttendanceReport = async (req, res) => {
    try {
        const { department, semester, subjectCode, startDate, endDate } = req.query;

        let query = {};

        if (department) query.department = department;
        if (semester) query.semester = parseInt(semester);
        if (subjectCode) query.subjectCode = subjectCode;

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const reports = await Attendance.find(query)
            .populate("teacher", "name employeeId")
            .populate("records.student", "usn name")
            .sort({ date: -1 })
            .lean();

        res.json({
            success: true,
            reports,
            count: reports.length,
        });
    } catch (error) {
        console.error("Get attendance report error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
