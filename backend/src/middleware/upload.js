
/**
 * @file    upload.js
 * @module  Middleware
 * @desc    Checks image uploads and keeps accepted files in memory for storage.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, matches the bucket limit

/**
 * FEATURE: Accept only supported image types.
 * LOGIC: Check the file's reported type → JPEG, PNG or WEBP: accept;
 * otherwise reject. This does not verify the actual file contents.
 */
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
};

/**
 * FEATURE: Limit uploaded image size.
 * LOGIC: Keep the upload in memory and reject files over 2 MB.
 * The accepted file can then be sent to storage by the calling code.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

module.exports = { upload };
