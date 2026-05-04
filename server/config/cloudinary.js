// config/cloudinary.js
// Cloudinary configuration for cloud file storage

const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} originalname - Original filename
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const cleanName = originalname
      .replace(/\.pdf$/i, "")
      .replace(/\s+/g, "_");
    const publicId = `college-assistant/notes/${Date.now()}-${cleanName}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { cloudinary, uploadToCloudinary };
