// =====================================================================
// Files for class materials, stored INSIDE MongoDB (GridFS).
// ---------------------------------------------------------------------
// Why not the server's disk? Most hosting (including Render's free plan)
// wipes the disk every time the app is redeployed, so uploaded files
// would silently disappear. GridFS is MongoDB's built-in way to keep
// files: it splits a file into small chunks in two collections
// (materials.files and materials.chunks). The files then live in Atlas
// with everything else, survive any redeploy, and are backed up with it.
// =====================================================================
const { mongoose } = require("../config/db");

const BUCKET = "materials";
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

// Saves a file and returns its id.
function saveFile(buffer, { fileName, mimeType }) {
  return new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(fileName, { metadata: { mimeType } });
    upload.on("finish", () => resolve(upload.id));
    upload.on("error", reject);
    upload.end(buffer);
  });
}

// A readable stream of the file, or null if it does not exist.
async function openFile(id) {
  const [info] = await bucket().find({ _id: new mongoose.Types.ObjectId(String(id)) }).toArray();
  return info ? { stream: bucket().openDownloadStream(info._id), size: info.length } : null;
}

async function deleteFile(id) {
  if (!id) return;
  try {
    await bucket().delete(new mongoose.Types.ObjectId(String(id)));
  } catch {
    // already gone: nothing to do
  }
}

module.exports = { saveFile, openFile, deleteFile, BUCKET };
