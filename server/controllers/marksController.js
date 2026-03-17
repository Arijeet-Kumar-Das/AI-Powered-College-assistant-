// controllers/marksController.js
// Marks management for teachers

const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const { checkSEEEligibility, getStudentAttendanceForSubject, MINIMUM_ATTENDANCE_PERCENT } = require("../utils/attendanceUtils");

/**
 * Get teacher's assigned subjects with full details
 */
exports.getTeacherSubjects = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const teacherId = decoded.id;

        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        // Get full subject details including subjectType
        const subjectCodes = teacher.subjectsAssigned?.map(s => s.subjectCode) || [];
        const subjects = await Subject.find({ subjectCode: { $in: subjectCodes } }).lean();

        // Merge teacher's assigned subjects with full subject details
        const enrichedSubjects = teacher.subjectsAssigned?.map(assigned => {
            const fullSubject = subjects.find(s => s.subjectCode === assigned.subjectCode);
            return {
                subjectCode: assigned.subjectCode,
                subjectName: assigned.subjectName || fullSubject?.subjectName,
                subjectType: fullSubject?.subjectType || "non-integrated",
                semester: fullSubject?.semester,
                department: fullSubject?.department,
                credits: fullSubject?.credits,
            };
        }) || [];

        res.json({
            success: true,
            subjects: enrichedSubjects,
            teacher: {
                name: teacher.name,
                employeeId: teacher.employeeId,
                department: teacher.department,
            },
        });
    } catch (error) {
        console.error("Error fetching teacher subjects:", error);
        res.status(500).json({ success: false, message: "Failed to fetch subjects" });
    }
};

/**
 * Get students for a specific subject (matching department + semester)
 * Now includes attendance eligibility status
 */
exports.getStudentsForSubject = async (req, res) => {
    try {
        const { subjectCode } = req.params;

        // Get subject details
        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // Find students in same department and semester
        const students = await Student.find({
            department: subject.department,
            semester: subject.semester,
        })
            .select("usn name email department semester section marks")
            .lean();

        // Extract marks for this specific subject and add attendance eligibility
        const studentsWithMarks = await Promise.all(students.map(async (student) => {
            const subjectMarks = student.marks?.find(m => m.subjectCode === subjectCode) || null;

            // Get attendance eligibility
            const eligibility = await checkSEEEligibility(student._id.toString(), subjectCode);
            const attendance = await getStudentAttendanceForSubject(student._id.toString(), subjectCode);

            return {
                _id: student._id,
                usn: student.usn,
                name: student.name,
                email: student.email,
                section: student.section,
                marks: subjectMarks,
                attendance: {
                    percentage: attendance.percentage,
                    totalClasses: attendance.totalClasses,
                    present: attendance.present,
                    absent: attendance.absent,
                    late: attendance.late,
                    hasRecords: attendance.hasRecords,
                },
                seeEligible: eligibility.canEnterSEE,
                seeEligibilityMessage: eligibility.message,
            };
        }));

        res.json({
            success: true,
            subject: {
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                subjectType: subject.subjectType,
                semester: subject.semester,
                department: subject.department,
            },
            students: studentsWithMarks,
            totalStudents: studentsWithMarks.length,
            minimumAttendance: MINIMUM_ATTENDANCE_PERCENT,
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ success: false, message: "Failed to fetch students" });
    }
};

/**
 * Update marks for a student
 * Handles both integrated and non-integrated subjects with proper calculation
 * BLOCKS SEE marks entry if attendance < 75%
 */
exports.updateStudentMarks = async (req, res) => {
    try {
        const { studentId, subjectCode, marks } = req.body;

        // Get subject to determine type
        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // CHECK ATTENDANCE ELIGIBILITY FOR SEE MARKS (only)
        if (marks.see && marks.see > 0) {
            const eligibility = await checkSEEEligibility(studentId, subjectCode);

            if (!eligibility.canEnterSEE && eligibility.percentage !== null) {
                return res.status(403).json({
                    success: false,
                    message: `Cannot enter SEE marks. Student has only ${eligibility.percentage}% attendance. Minimum ${MINIMUM_ATTENDANCE_PERCENT}% required.`,
                    attendance: eligibility.percentage,
                    required: MINIMUM_ATTENDANCE_PERCENT,
                    shortfall: eligibility.shortfall,
                });
            }
        }

        const isIntegrated = subject.subjectType === "integrated";

        // Calculate stored values based on subject type
        let storedMarks = {
            subjectCode,
            subjectName: subject.subjectName,
            semester: subject.semester,
            academicYear: marks.academicYear || `${new Date().getFullYear()}`,
        };

        if (isIntegrated) {
            // Integrated: CIE1/10, CIE2/10, AAT/10, Lab/20, SEE/100→50
            storedMarks.cie1 = Math.min(marks.cie1 || 0, 10);
            storedMarks.cie2 = Math.min(marks.cie2 || 0, 10);
            storedMarks.aat = Math.min(marks.aat || 0, 10);
            storedMarks.lab = Math.min(marks.lab || 0, 20);
            storedMarks.cieTotal = storedMarks.cie1 + storedMarks.cie2 + storedMarks.aat + storedMarks.lab;
            storedMarks.seeMarks = Math.round((Math.min(marks.see || 0, 100)) / 2);
        } else {
            // Non-integrated: CIE1/40→20, CIE2/40→20, AAT/10, SEE/100→50
            storedMarks.cie1 = Math.round((Math.min(marks.cie1 || 0, 40)) / 2);
            storedMarks.cie2 = Math.round((Math.min(marks.cie2 || 0, 40)) / 2);
            storedMarks.aat = Math.min(marks.aat || 0, 10);
            storedMarks.lab = 0; // Non-integrated has no lab
            storedMarks.cieTotal = storedMarks.cie1 + storedMarks.cie2 + storedMarks.aat;
            storedMarks.seeMarks = Math.round((Math.min(marks.see || 0, 100)) / 2);
        }

        // Update student's marks array
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // Find and update or add marks for this subject
        const existingMarkIndex = student.marks.findIndex(m => m.subjectCode === subjectCode);
        if (existingMarkIndex >= 0) {
            student.marks[existingMarkIndex] = storedMarks;
        } else {
            student.marks.push(storedMarks);
        }

        await student.save();

        res.json({
            success: true,
            message: "Marks updated successfully",
            storedMarks,
            student: {
                usn: student.usn,
                name: student.name,
            },
        });
    } catch (error) {
        console.error("Error updating marks:", error);
        res.status(500).json({ success: false, message: "Failed to update marks" });
    }
};

/**
 * Bulk update marks for multiple students
 * Checks attendance eligibility before allowing SEE marks
 */
exports.bulkUpdateMarks = async (req, res) => {
    try {
        const { subjectCode, studentsMarks } = req.body;

        // Get subject to determine type
        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        const isIntegrated = subject.subjectType === "integrated";
        const results = [];
        const ineligibleStudents = [];

        for (const entry of studentsMarks) {
            const { studentId, marks } = entry;

            // CHECK ATTENDANCE ELIGIBILITY FOR SEE MARKS
            if (marks.see && marks.see > 0) {
                const eligibility = await checkSEEEligibility(studentId, subjectCode);

                if (!eligibility.canEnterSEE && eligibility.percentage !== null) {
                    const student = await Student.findById(studentId).select("usn name").lean();
                    ineligibleStudents.push({
                        studentId,
                        usn: student?.usn || "Unknown",
                        name: student?.name || "Unknown",
                        attendance: eligibility.percentage,
                        message: eligibility.message,
                    });
                    results.push({
                        studentId,
                        usn: student?.usn,
                        success: false,
                        error: `Ineligible - ${eligibility.percentage}% attendance`
                    });
                    continue; // Skip this student
                }
            }

            let storedMarks = {
                subjectCode,
                subjectName: subject.subjectName,
                semester: subject.semester,
                academicYear: marks.academicYear || `${new Date().getFullYear()}`,
            };

            if (isIntegrated) {
                storedMarks.cie1 = Math.min(marks.cie1 || 0, 10);
                storedMarks.cie2 = Math.min(marks.cie2 || 0, 10);
                storedMarks.aat = Math.min(marks.aat || 0, 10);
                storedMarks.lab = Math.min(marks.lab || 0, 20);
                storedMarks.cieTotal = storedMarks.cie1 + storedMarks.cie2 + storedMarks.aat + storedMarks.lab;
                storedMarks.seeMarks = Math.round((Math.min(marks.see || 0, 100)) / 2);
            } else {
                storedMarks.cie1 = Math.round((Math.min(marks.cie1 || 0, 40)) / 2);
                storedMarks.cie2 = Math.round((Math.min(marks.cie2 || 0, 40)) / 2);
                storedMarks.aat = Math.min(marks.aat || 0, 10);
                storedMarks.lab = 0;
                storedMarks.cieTotal = storedMarks.cie1 + storedMarks.cie2 + storedMarks.aat;
                storedMarks.seeMarks = Math.round((Math.min(marks.see || 0, 100)) / 2);
            }

            const student = await Student.findById(studentId);
            if (student) {
                const existingMarkIndex = student.marks.findIndex(m => m.subjectCode === subjectCode);
                if (existingMarkIndex >= 0) {
                    student.marks[existingMarkIndex] = storedMarks;
                } else {
                    student.marks.push(storedMarks);
                }
                await student.save();
                results.push({ studentId, usn: student.usn, success: true });
            } else {
                results.push({ studentId, success: false, error: "Student not found" });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            message: `Updated marks for ${successCount} students. ${failedCount > 0 ? `${failedCount} failed (attendance ineligible or not found).` : ''}`,
            results,
            ineligibleStudents,
            summary: {
                total: studentsMarks.length,
                successful: successCount,
                failed: failedCount,
                ineligible: ineligibleStudents.length,
            },
        });
    } catch (error) {
        console.error("Error bulk updating marks:", error);
        res.status(500).json({ success: false, message: "Failed to update marks" });
    }
};

/**
 * Get all marks for a subject
 */
exports.getMarksForSubject = async (req, res) => {
    try {
        const { subjectCode } = req.params;

        const subject = await Subject.findOne({ subjectCode }).lean();
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // Find all students who have marks for this subject
        const students = await Student.find({
            "marks.subjectCode": subjectCode,
        })
            .select("usn name marks")
            .lean();

        const marksData = students.map(student => {
            const subjectMarks = student.marks.find(m => m.subjectCode === subjectCode);
            return {
                usn: student.usn,
                name: student.name,
                ...subjectMarks,
            };
        });

        res.json({
            success: true,
            subject: {
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                subjectType: subject.subjectType,
            },
            marks: marksData,
            totalRecords: marksData.length,
        });
    } catch (error) {
        console.error("Error fetching marks:", error);
        res.status(500).json({ success: false, message: "Failed to fetch marks" });
    }
};
