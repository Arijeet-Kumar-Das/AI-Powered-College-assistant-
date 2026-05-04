// scripts/migrateNotesToCloudinary.js
// One-time migration script to upload existing local notes to Cloudinary
// Usage: node scripts/migrateNotesToCloudinary.js

require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../config/cloudinary");
const Note = require("../models/Note");

const MONGODB_URI = process.env.MONGODB_URI;

const migrate = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all notes that have local file paths (not Cloudinary URLs)
    const localNotes = await Note.find({
      filePath: { $not: /^https?:\/\// }, // Not a URL = local path
    });

    if (localNotes.length === 0) {
      console.log("✅ No local notes found — nothing to migrate!");
      process.exit(0);
    }

    console.log(`📁 Found ${localNotes.length} notes with local file paths\n`);

    let migrated = 0;
    let failed = 0;
    let missing = 0;

    for (const note of localNotes) {
      const localPath = note.filePath;
      const absolutePath = path.isAbsolute(localPath)
        ? localPath
        : path.join(__dirname, "..", localPath);

      console.log(`📄 Processing: "${note.title}" (${note.fileName})`);

      // Check if the local file still exists
      if (!fs.existsSync(absolutePath)) {
        console.log(`   ⚠️  File not found at: ${absolutePath}`);
        console.log(`   ❌ Skipping — file missing from disk\n`);
        missing++;
        continue;
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(absolutePath, {
          folder: "college-assistant/notes",
          resource_type: "raw",
          public_id: `${Date.now()}-${note.fileName.replace(/\.pdf$/i, "").replace(/\s+/g, "_")}`,
        });

        // Update the note in MongoDB
        await Note.updateOne(
          { _id: note._id },
          {
            $set: {
              filePath: result.secure_url,
              cloudinaryId: result.public_id,
            },
          }
        );

        console.log(`   ✅ Uploaded to Cloudinary: ${result.secure_url}\n`);
        migrated++;
      } catch (uploadErr) {
        console.error(`   ❌ Upload failed: ${uploadErr.message}\n`);
        failed++;
      }
    }

    console.log("\n========== MIGRATION SUMMARY ==========");
    console.log(`Total notes found:    ${localNotes.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Files not found:      ${missing}`);
    console.log(`Upload failures:      ${failed}`);
    console.log("========================================\n");

    if (missing > 0) {
      console.log(
        "⚠️  Notes with missing files will keep their old paths.\n" +
        "   You can delete them from the admin panel or re-upload the PDFs.\n"
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("💥 Migration error:", error);
    process.exit(1);
  }
};

migrate();
