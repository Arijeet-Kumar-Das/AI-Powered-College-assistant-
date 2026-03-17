// models/Attendance.js
// Attendance tracking for students per subject per date

const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    status: {
        type: String,
        enum: ["present", "absent", "late"],
        required: true,
    },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    },
    subjectCode: {
        type: String,
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    section: String,
    records: [attendanceRecordSchema],
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLate: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index to prevent duplicate attendance for same subject on same date
attendanceSchema.index({ date: 1, subjectCode: 1, section: 1 }, { unique: true });

// Pre-save hook to calculate totals
attendanceSchema.pre("save", function (next) {
    this.totalPresent = this.records.filter(r => r.status === "present").length;
    this.totalAbsent = this.records.filter(r => r.status === "absent").length;
    this.totalLate = this.records.filter(r => r.status === "late").length;
    next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);
