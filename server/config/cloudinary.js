// config/cloudinary.js
// Cloudinary configuration for cloud file storage

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage engine for PDF notes uploads
const notesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "college-assistant/notes",
    resource_type: "raw", // Required for PDFs (non-image files)
    allowed_formats: ["pdf"],
    // Preserve original filename in public_id
    public_id: (req, file) => {
      const cleanName = file.originalname
        .replace(/\.pdf$/i, "")
        .replace(/\s+/g, "_");
      return `${Date.now()}-${cleanName}`;
    },
  },
});

module.exports = { cloudinary, notesStorage };
