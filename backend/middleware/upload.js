// =====================================================================
// File uploads for class materials (multer).
//   * 10 MB maximum
//   * only documents, images and audio a class would use
//   * kept in memory only briefly, then stored in MongoDB (GridFS, see
//     services/fileStore.js), so files survive every redeploy
//   * never served publicly: see downloadMaterial in groupController
// =====================================================================
const multer = require("multer");
const AppError = require("../utils/AppError");

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/ogg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, done) => {
    if (ALLOWED.has(file.mimetype)) return done(null, true);
    return done(new AppError("That file type is not allowed. Use PDF, Word, PowerPoint, an image, audio or a text file.", 400));
  },
});

module.exports = { upload, MAX_BYTES, ALLOWED };
