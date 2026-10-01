const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { ROLES } = require("../config/roles");

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const parentSettingsSchema = new mongoose.Schema(
  {
    childName: { type: String, default: "", trim: true, maxlength: 40 },
    dailyMinutes: { type: Number, default: 20, min: 5, max: 180 },
    weeklyGoalDays: { type: Number, default: 4, min: 1, max: 7 },
    allowedTracks: {
      language: { type: Boolean, default: true },
      culture: { type: Boolean, default: true },
    },
    allowSpeaking: { type: Boolean, default: true },
    requirePin: { type: Boolean, default: false },
    pinHash: { type: String, default: null, select: false },
    // A plain yes/no kept next to the hidden hash, so every response can
    // say whether a PIN is set without loading the hash itself.
    hasPin: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Enter your name."],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Enter your email."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: "Choose your role." },
      required: true,
    },
    details: {
      avatar: { type: String, default: null }, // child photo (Cultural Passport) or learner photo
      parentAvatar: { type: String, default: null }, // parent photo (parent view)
      onboarding: {
        // null until the learner picks one in the Language Hub
        language: { type: String, default: null },
        completed: { type: Boolean, default: false },
      },
      classes: { type: [mongoose.Schema.Types.Mixed], default: [] },
      parentSettings: { type: parentSettingsSchema, default: () => ({}) },
    },
  },
  { timestamps: true },
);

// Hashing password..
userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(String(candidate), this.password);
};

userSchema.methods.setPin = async function setPin(pin) {
  this.details.parentSettings.pinHash = pin
    ? await bcrypt.hash(String(pin), SALT_ROUNDS)
    : null;
  this.details.parentSettings.hasPin = Boolean(pin);
};

userSchema.methods.comparePin = function comparePin(pin) {
  const hash = this.details?.parentSettings?.pinHash;
  return hash ? bcrypt.compare(String(pin), hash) : Promise.resolve(false);
};

userSchema.set("toJSON", {
  transform(doc, ret) {
    const settings = ret.details?.parentSettings ?? {};
    return {
      id: String(ret._id),
      name: ret.name,
      email: ret.email,
      role: ret.role,
      createdAt: ret.createdAt,
      details: {
        avatar: ret.details?.avatar ?? null,
        parentAvatar: ret.details?.parentAvatar ?? null,
        onboarding: ret.details?.onboarding ?? {
          language: null,
          completed: false,
        },
        classes: ret.details?.classes ?? [],
        parentSettings: {
          childName: settings.childName ?? "",
          dailyMinutes: settings.dailyMinutes ?? 20,
          weeklyGoalDays: settings.weeklyGoalDays ?? 4,
          allowedTracks: settings.allowedTracks ?? {
            language: true,
            culture: true,
          },
          allowSpeaking: settings.allowSpeaking ?? true,
          requirePin: settings.requirePin ?? false,
          hasPin: Boolean(settings.hasPin),
        },
      },
    };
  },
});

module.exports = mongoose.model("User", userSchema);
