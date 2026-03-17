// models/FeedbackResponse.js
// Student's feedback submission for a teacher

const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "FeedbackQuestion", required: true },
        rating: {
            type: String,
            enum: ["excellent", "good", "average", "poor"],
            required: true
        },
    },
    { _id: false }
);

const feedbackResponseSchema = new mongoose.Schema(
    {
        session: { type: mongoose.Schema.Types.ObjectId, ref: "FeedbackSession", required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        subjectCode: { type: String },
        ratings: [ratingSchema],
        comment: { type: String, default: "" },  // Optional anonymous comment
        submittedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Ensure student can only submit once per teacher per session
feedbackResponseSchema.index({ session: 1, student: 1, teacher: 1 }, { unique: true });

// Indexes for aggregation
feedbackResponseSchema.index({ session: 1, teacher: 1 });
feedbackResponseSchema.index({ teacher: 1 });

// Static method to get rating value (for aggregation)
feedbackResponseSchema.statics.getRatingValue = function (rating) {
    const values = { excellent: 4, good: 3, average: 2, poor: 1 };
    return values[rating] || 0;
};

module.exports = mongoose.model("FeedbackResponse", feedbackResponseSchema);
