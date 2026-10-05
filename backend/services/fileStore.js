
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
