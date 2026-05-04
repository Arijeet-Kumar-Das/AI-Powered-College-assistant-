// controllers/notesController.js
// Handles PDF upload to Cloudinary, download via URL, and management

const Note = require("../models/Note");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const { cloudinary } = require("../config/cloudinary");

// ==================== TEACHER APIS ====================

// Upload a new note (PDF) — file is already on Cloudinary via multer-storage-cloudinary
exports.uploadNote = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const { title, description, subjectCode } = req.body;
        const teacherId = req.teacher._id;

        if (!title || !subjectCode) {
            // Delete uploaded file from Cloudinary if validation fails
            if (req.file.filename) {
                await cloudinary.uploader.destroy(req.file.filename, { resource_type: "raw" });
            }
            return res.status(400).json({ success: false, message: "Title and subject code are required" });
        }

        // Find subject details
        const subject = await Subject.findOne({ subjectCode });
        if (!subject) {
            if (req.file.filename) {
                await cloudinary.uploader.destroy(req.file.filename, { resource_type: "raw" });
            }
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // Get teacher info
        const teacher = await Teacher.findById(teacherId);

        const note = new Note({
            title,
            description: description || "",
            fileName: req.file.originalname,
            filePath: req.file.path,           // Cloudinary URL
            cloudinaryId: req.file.filename,   // Cloudinary public_id for deletion
            fileSize: req.file.size || 0,
            mimeType: req.file.mimetype || "application/pdf",
            subject: subject._id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            semester: subject.semester,
            department: subject.department,
            uploadedBy: teacherId,
            uploadedByName: teacher.name,
        });

        await note.save();

        res.status(201).json({
            success: true,
            message: "Note uploaded successfully",
            note: {
                id: note._id,
                title: note.title,
                fileName: note.fileName,
                subjectCode: note.subjectCode,
                subjectName: note.subjectName,
                fileSize: note.fileSize,
                createdAt: note.createdAt,
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        // Clean up Cloudinary file on error
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename, { resource_type: "raw" });
            } catch (cleanupErr) {
                console.error("Cloudinary cleanup error:", cleanupErr);
            }
        }
        res.status(500).json({ success: false, message: "Error uploading note" });
    }
};

// Get all notes uploaded by a teacher
exports.getTeacherNotes = async (req, res) => {
    try {
        const teacherId = req.teacher._id;

        const notes = await Note.find({ uploadedBy: teacherId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            notes: notes.map((n) => ({
                id: n._id,
                title: n.title,
                description: n.description,
                fileName: n.fileName,
                fileSize: n.fileSize,
                subjectCode: n.subjectCode,
                subjectName: n.subjectName,
                semester: n.semester,
                department: n.department,
                downloads: n.downloads,
                createdAt: n.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get teacher notes error:", error);
        res.status(500).json({ success: false, message: "Error fetching notes" });
    }
};

// Delete a note (removes from Cloudinary + MongoDB)
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.teacher._id;

        const note = await Note.findOne({ _id: id, uploadedBy: teacherId });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found or unauthorized" });
        }

        // Delete file from Cloudinary
        if (note.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(note.cloudinaryId, { resource_type: "raw" });
            } catch (cloudErr) {
                console.error("Cloudinary delete error:", cloudErr);
                // Continue with DB deletion even if Cloudinary fails
            }
        }

        await Note.deleteOne({ _id: id });

        res.json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ success: false, message: "Error deleting note" });
    }
};

// ==================== STUDENT APIS ====================

// Get notes available for a student (based on semester/department)
exports.getStudentNotes = async (req, res) => {
    try {
        const studentId = req.student._id;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // Get notes matching student's semester and department
        // OR notes for subjects the student has marks in
        const studentSubjectCodes = student.marks.map((m) => m.subjectCode);

        const notes = await Note.find({
            $or: [
                { semester: student.semester, department: student.department },
                { subjectCode: { $in: studentSubjectCodes } },
            ],
        })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            notes: notes.map((n) => ({
                id: n._id,
                title: n.title,
                description: n.description,
                fileName: n.fileName,
                fileSize: n.fileSize,
                fileUrl: n.filePath, // Cloudinary URL — direct download link
                subjectCode: n.subjectCode,
                subjectName: n.subjectName,
                uploadedBy: n.uploadedByName,
                downloads: n.downloads,
                createdAt: n.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get student notes error:", error);
        res.status(500).json({ success: false, message: "Error fetching notes" });
    }
};

// Download a note (redirect to Cloudinary URL)
exports.downloadNote = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.student._id;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        // Check access: student must be in same semester/department OR have marks for subject
        const studentSubjectCodes = student.marks.map((m) => m.subjectCode);
        const hasAccess =
            (note.semester === student.semester && note.department === student.department) ||
            studentSubjectCodes.includes(note.subjectCode);

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: "You don't have access to this note" });
        }

        // Increment download count
        await Note.updateOne({ _id: id }, { $inc: { downloads: 1 } });

        // Redirect to Cloudinary URL for download
        res.redirect(note.filePath);
    } catch (error) {
        console.error("Download note error:", error);
        res.status(500).json({ success: false, message: "Error downloading note" });
    }
};

// Get subjects taught by a teacher (for dropdown)
exports.getTeacherSubjects = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        // Get subjects based on teacher's department and subjects field
        let subjects = [];
        if (teacher.subjects && teacher.subjects.length > 0) {
            subjects = await Subject.find({ subjectCode: { $in: teacher.subjects } });
        } else {
            // Fallback: get all subjects in teacher's department
            subjects = await Subject.find({ department: teacher.department });
        }

        res.json({
            success: true,
            subjects: subjects.map((s) => ({
                id: s._id,
                subjectCode: s.subjectCode,
                subjectName: s.subjectName,
                semester: s.semester,
                department: s.department,
            })),
        });
    } catch (error) {
        console.error("Get teacher subjects error:", error);
        res.status(500).json({ success: false, message: "Error fetching subjects" });
    }
};
