// models/FAQ.js
const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ["academic", "facilities", "administration", "technical", "general"],
      default: "general",
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Full-text search index for questions and answers
faqSchema.index({ question: "text", answer: "text", tags: "text" });
faqSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model("FAQ", faqSchema);
