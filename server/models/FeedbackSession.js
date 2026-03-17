// models/FeedbackSession.js
// Admin-controlled feedback collection window

const mongoose = require("mongoose");

const feedbackSessionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },  // "Semester 4 Feedback - Jan 2026"
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: false },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        targetSemester: { type: Number },  // null = all semesters
        targetDepartment: { type: String }, // null = all departments
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },
    { timestamps: true }
);

// Ensure only one session is active at a time
feedbackSessionSchema.pre("save", async function (next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

// Indexes
feedbackSessionSchema.index({ isActive: 1 });
feedbackSessionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("FeedbackSession", feedbackSessionSchema);
