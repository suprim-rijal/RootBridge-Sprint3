/*
FILE: backend/middleware/upload.js
OWNER: Member 3 - Classes and teachers

WHAT THIS FILE DOES
The rules for uploading class materials: how big, what kind, and where they go.

BEFORE YOU WRITE ANY CODE HERE
  1. Read this file's chapter in docs/RootBridge-Course-Book.pdf.
  2. Check OWNERSHIP.md - if you are not the owner, open an issue instead
     of editing, or agree a hand-over in the group chat first.
  3. Create a branch named   feature/<area>-<short-task>   from develop.

WHEN YOU HAVE FINISHED
  - Run the checks for your side (backend: npm test, frontend: npm run build).
  - Commit in small steps with messages that say WHY, not just what.
  - Open a pull request into develop and ask one teammate to review.
*/
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
