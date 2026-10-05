// Connects to MongoDB with Mongoose. server.js calls this before listening.
const mongoose = require("mongoose");
const { env } = require("./env");

mongoose.set("strictQuery", true);

async function connectDB(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

function disconnectDB() {
  return mongoose.connection.close();
}

// "connected", "disconnected", ... used by /api/health
function dbState() {
  return ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown";
}

module.exports = { connectDB, disconnectDB, dbState, mongoose };
