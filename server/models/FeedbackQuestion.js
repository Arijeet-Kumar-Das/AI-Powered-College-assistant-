// models/FeedbackQuestion.js
// Predefined questions for teacher feedback

const mongoose = require("mongoose");

const feedbackQuestionSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },  // "How well does the teacher explain concepts?"
        category: {
            type: String,
            enum: ["teaching", "communication", "punctuality", "materials", "overall"],
            default: "teaching"
        },
        order: { type: Number, default: 0 },     // Display order
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index
feedbackQuestionSchema.index({ order: 1 });
feedbackQuestionSchema.index({ isActive: 1, order: 1 });

// Static method to seed default questions
feedbackQuestionSchema.statics.seedDefaultQuestions = async function () {
    const count = await this.countDocuments();
    if (count === 0) {
        const defaultQuestions = [
            { text: "How well does the teacher explain concepts?", category: "teaching", order: 1 },
            { text: "Is the teacher approachable for doubts and queries?", category: "communication", order: 2 },
            { text: "Is the teacher punctual to classes?", category: "punctuality", order: 3 },
            { text: "Quality of course materials provided", category: "materials", order: 4 },
            { text: "Does the teacher engage students in class?", category: "teaching", order: 5 },
            { text: "How would you rate the teacher's overall performance?", category: "overall", order: 6 },
        ];
        await this.insertMany(defaultQuestions);
        console.log("✅ Default feedback questions seeded");
    }
};

module.exports = mongoose.model("FeedbackQuestion", feedbackQuestionSchema);
