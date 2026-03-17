// models/Notice.js
const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal"
    },
    targetAudience: {
      type: String,
      enum: ["all", "students", "faculty"],
      default: "all"
    },
    isPinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "active"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },
  },
  { timestamps: true }
);

// Index for efficient queries
noticeSchema.index({ status: 1, priority: 1 });
noticeSchema.index({ targetAudience: 1 });

module.exports = mongoose.model("Notice", noticeSchema);
