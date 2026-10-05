// A message from the public contact form.
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Enter your name."], trim: true, maxlength: 80 },
    email: { type: String, required: [true, "Enter your email."], trim: true, lowercase: true },
    subject: { type: String, default: "General Query", maxlength: 120 },
    message: { type: String, required: [true, "Write a message."], maxlength: 3000 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
