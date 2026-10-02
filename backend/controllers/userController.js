const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const ALLOWED_DETAIL_KEYS = ["avatar", "parentAvatar", "onboarding", "parentSettings"];
const PHOTO = /^data:image\/(png|jpeg|webp);base64,/;
const MAX_PHOTO_BYTES = 300_000;
const LANGUAGES = ["nepali", "finnish", "japanese", "twi"];

const updateUser = asyncHandler(async (req, res) => {
  const { userId, name, details } = req.body || {};
  const user = await User.findById(req.user._id).select("+details.parentSettings.pinHash");
  if (!user) throw new AppError("This account no longer exists. Please log in again.", 401);
  if (userId && String(userId) !== String(user._id)) {
    throw new AppError("You can only change your own account.", 403);
  }
  if (details !== undefined && (typeof details !== "object" || details === null || Array.isArray(details))) {
    throw new AppError("details must be an object.", 400);
  }

  if (name !== undefined) {
    if (!String(name).trim()) throw new AppError("Your name cannot be empty.", 400);
    user.name = String(name).trim();
  }

  for (const key of Object.keys(details || {})) {
    if (!ALLOWED_DETAIL_KEYS.includes(key)) continue; // ignore unknown keys
    if (key === "parentSettings") {
      
      const { pin, hasPin: _ignored, pinHash: _alsoIgnored, ...settings } = details.parentSettings || {};
      const keepHash = user.details.parentSettings?.pinHash ?? null;
      user.details.parentSettings = { ...settings, pinHash: keepHash, hasPin: Boolean(keepHash) };
      if (pin !== undefined) {
        if (pin && !/^\d{4}$/.test(String(pin))) throw new AppError("The PIN must be 4 digits.", 400);
        await user.setPin(pin || null);
      }
    } else if (key === "avatar" || key === "parentAvatar") {
      const photo = details[key];
      if (photo !== null && (typeof photo !== "string" || !PHOTO.test(photo) || photo.length > MAX_PHOTO_BYTES)) {
        throw new AppError("That photo is not a valid image, or it is too large.", 400);
      }
      user.details[key] = photo;
    } else {
      if (key === "onboarding") {
        const language = details.onboarding?.language;
        if (language !== null && language !== undefined && !LANGUAGES.includes(language)) {
          throw new AppError("That language is not available yet.", 400);
        }
      }
      user.details[key] = details[key];
    }
  }

  user.markModified("details");
  await user.save();
  res.json({ success: true, message: "Account updated", user });
});

const verifyPin = asyncHandler(async (req, res) => {
  const { pin } = req.body || {};
  if (!/^\d{4}$/.test(String(pin ?? ""))) throw new AppError("Enter your 4-digit PIN.", 400);
  const withPin = await User.findById(req.user._id).select("+details.parentSettings.pinHash");
  if (!(await withPin.comparePin(pin))) throw new AppError("That PIN is not correct.", 401);
  res.json({ success: true, message: "PIN correct" });
});


const resetPin = asyncHandler(async (req, res) => {
  const { password, newPin } = req.body || {};
  if (!password) throw new AppError("Enter your account password.", 400);
  if (newPin !== undefined && newPin !== null && newPin !== "" && !/^\d{4}$/.test(String(newPin))) {
    throw new AppError("The new PIN must be 4 digits.", 400);
  }

  const user = await User.findById(req.user._id).select("+password +details.parentSettings.pinHash");
  if (!(await user.comparePassword(password))) throw new AppError("That is not your account password.", 401);

  await user.setPin(newPin || null);
  if (!newPin) user.details.parentSettings.requirePin = false; // no PIN, no lock
  user.markModified("details");
  await user.save();

  res.json({
    success: true,
    message: newPin ? "Your new PIN is ready." : "The PIN was removed. The parent view opens without one now.",
    user,
  });
});

module.exports = { updateUser, verifyPin, resetPin };
