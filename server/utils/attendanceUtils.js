// utils/attendanceUtils.js
// Utility functions for attendance calculations

const Attendance = require("../models/Attendance");

const MINIMUM_ATTENDANCE_PERCENT = 75;

/**
 * Calculate attendance percentage for a student for a specific subject
 * @param {String} studentId - Student's MongoDB ID
 * @param {String} subjectCode - Subject code to calculate attendance for
 * @returns {Object} { percentage, totalClasses, present, absent, late, eligible }
 */
const getStudentAttendanceForSubject = async (studentId, subjectCode) => {
    try {
        // Find all attendance records for this subject
        const attendanceRecords = await Attendance.find({
            subjectCode,
            "records.student": studentId,
        }).lean();

        if (attendanceRecords.length === 0) {
            return {
                percentage: 0,
                totalClasses: 0,
                present: 0,
                absent: 0,
                late: 0,
                eligible: true, // No attendance records means no restriction yet
                hasRecords: false,
            };
        }

        let present = 0;
        let absent = 0;
        let late = 0;

        attendanceRecords.forEach((record) => {
            const studentRecord = record.records.find(
                (r) => r.student.toString() === studentId.toString()
            );
            if (studentRecord) {
                if (studentRecord.status === "present") present++;
                else if (studentRecord.status === "absent") absent++;
                else if (studentRecord.status === "late") late++;
            }
        });

        const totalClasses = present + absent + late;
        // Late counts as present for eligibility (can be adjusted)
        const attendedClasses = present + late;
        const percentage = totalClasses > 0
            ? Math.round((attendedClasses / totalClasses) * 100)
            : 0;

        return {
            percentage,
            totalClasses,
            present,
            absent,
            late,
            eligible: percentage >= MINIMUM_ATTENDANCE_PERCENT || totalClasses === 0,
            hasRecords: true,
        };
    } catch (error) {
        console.error("Error calculating attendance:", error);
        return {
            percentage: 0,
            totalClasses: 0,
            present: 0,
            absent: 0,
            late: 0,
            eligible: true,
            hasRecords: false,
            error: error.message,
        };
    }
};

/**
 * Get attendance summary for all subjects for a student
 * @param {String} studentId - Student's MongoDB ID
 * @returns {Array} Array of { subjectCode, percentage, totalClasses, present, absent, late, eligible }
 */
const getStudentAttendanceSummary = async (studentId) => {
    try {
        // Get all unique subjects for which this student has attendance
        const attendanceRecords = await Attendance.find({
            "records.student": studentId,
        }).lean();

        // Group by subject
        const subjectMap = {};

        attendanceRecords.forEach((record) => {
            if (!subjectMap[record.subjectCode]) {
                subjectMap[record.subjectCode] = {
                    subjectCode: record.subjectCode,
                    present: 0,
                    absent: 0,
                    late: 0,
                };
            }

            const studentRecord = record.records.find(
                (r) => r.student.toString() === studentId.toString()
            );
            if (studentRecord) {
                if (studentRecord.status === "present") subjectMap[record.subjectCode].present++;
                else if (studentRecord.status === "absent") subjectMap[record.subjectCode].absent++;
                else if (studentRecord.status === "late") subjectMap[record.subjectCode].late++;
            }
        });

        // Calculate percentages
        const summary = Object.values(subjectMap).map((subj) => {
            const totalClasses = subj.present + subj.absent + subj.late;
            const attendedClasses = subj.present + subj.late;
            const percentage = totalClasses > 0
                ? Math.round((attendedClasses / totalClasses) * 100)
                : 0;

            return {
                ...subj,
                totalClasses,
                percentage,
                eligible: percentage >= MINIMUM_ATTENDANCE_PERCENT || totalClasses === 0,
            };
        });

        return summary;
    } catch (error) {
        console.error("Error getting attendance summary:", error);
        return [];
    }
};

/**
 * Check if a student is eligible to appear for SEE exam
 * @param {String} studentId - Student's MongoDB ID
 * @param {String} subjectCode - Subject code
 * @returns {Object} { eligible, percentage, message }
 */
const checkSEEEligibility = async (studentId, subjectCode) => {
    const attendance = await getStudentAttendanceForSubject(studentId, subjectCode);

    if (!attendance.hasRecords) {
        return {
            eligible: true,
            percentage: null,
            message: "No attendance records found",
            canEnterSEE: true,
        };
    }

    if (attendance.percentage >= MINIMUM_ATTENDANCE_PERCENT) {
        return {
            eligible: true,
            percentage: attendance.percentage,
            message: `Eligible (${attendance.percentage}% attendance)`,
            canEnterSEE: true,
        };
    }

    return {
        eligible: false,
        percentage: attendance.percentage,
        message: `Not eligible - ${attendance.percentage}% attendance (minimum ${MINIMUM_ATTENDANCE_PERCENT}% required)`,
        canEnterSEE: false,
        shortfall: MINIMUM_ATTENDANCE_PERCENT - attendance.percentage,
    };
};

module.exports = {
    getStudentAttendanceForSubject,
    getStudentAttendanceSummary,
    checkSEEEligibility,
    MINIMUM_ATTENDANCE_PERCENT,
};
