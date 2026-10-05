// POST /api/contact — a message from the public contact form, saved in MongoDB.
// (There is no admin page in Sprint 3; messages can be read in MongoDB Atlas.)
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const saved = await Message.create({ name, email, subject: subject || "General Query", message });
  res.status(201).json({ success: true, message: "Message stored successfully", contact: saved });
});

// GET /api/contact/messages
// secret instead: set SUPPORT_TOKEN in .env and send it as the
// "x-support-token" header. Without the setting, the route is switched off.
const listMessages = asyncHandler(async (req, res) => {
  const { env } = require("../config/env");
  if (!env.supportToken) throw new AppError("Reading messages is switched off. Set SUPPORT_TOKEN in .env.", 404);
  if (req.headers["x-support-token"] !== env.supportToken) throw new AppError("Wrong support token.", 401);
  const messages = await Message.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, count: messages.length, data: messages });
});

module.exports = { createMessage, listMessages };
