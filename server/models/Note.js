// models/Note.js
// Schema for storing uploaded notes/PDFs

const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        fileName: { type: String, required: true },      // Original file name
        filePath: { type: String, required: true },      // Cloudinary URL
        cloudinaryId: { type: String },                  // Cloudinary public_id for deletion
        fileSize: { type: Number, default: 0 },          // Size in bytes
        mimeType: { type: String, default: "application/pdf" },

        // Subject linking
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        subjectCode: { type: String, required: true },
        subjectName: { type: String },

        // Target audience
        semester: { type: Number, required: true },
        department: { type: String, required: true },

        // Uploader info
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
        uploadedByName: { type: String },

        // Stats
        downloads: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes for efficient queries
noteSchema.index({ subjectCode: 1 });
noteSchema.index({ semester: 1, department: 1 });
noteSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("Note", noteSchema);
