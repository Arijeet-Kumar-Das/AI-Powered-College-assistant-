// models/Chat.js
// Enhanced Chat schema for storing conversation history with LLM support

const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // User reference (polymorphic - can be Student, Teacher, or Admin)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userModel",
      required: true,
      index: true,
    },
    userModel: {
      type: String,
      enum: ["Student", "Teacher", "Admin"],
      required: true,
    },

    // Message content
    message: {
      type: String,
      required: true,
    },
    botResponse: {
      type: String,
      required: true,
    },

    // Intent classification
    intent: {
      type: String,
      enum: [
        // Student intents
        "BASIC_INFO",
        "USN",
        "COURSE",
        "DEPARTMENT",
        "SEMESTER",
        "SECTION",
        "CONTACT",
        "MARKS",
        "MARKS_CIE",
        "MARKS_SEE",
        "MARKS_PASS_STATUS",
        "MARKS_SUBJECT",
        // Leave/Email intents
        "LEAVE_APPLICATION",
        // Teacher intents
        "MY_SUBJECTS",
        "SUBJECT_CREDITS",
        "SEMESTER_INFO",
        // Common intents
        "GENERAL",
        "UNKNOWN",
      ],
      default: "UNKNOWN",
    },

    // LLM tracking
    isLLMResponse: {
      type: Boolean,
      default: false,
    },
    llmModel: {
      type: String,
      default: null,
    },

    // Session grouping for conversation context
    sessionId: {
      type: String,
      index: true,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index for efficient user chat history queries
chatSchema.index({ userId: 1, userModel: 1, timestamp: -1 });

// Index for session-based queries
chatSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model("Chat", chatSchema);
