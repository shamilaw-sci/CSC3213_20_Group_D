/**
 * @file    upload.js
 * @module  Middleware
 * @desc    Multer configuration for handling multipart file uploads.
 *          Uses memory storage (no disk writes) since uploaded files
 *          are streamed straight to Supabase Storage buckets.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, matches the bucket limit

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

module.exports = { upload };