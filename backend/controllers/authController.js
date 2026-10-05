//   POST /api/auth/signup           create account, returns a token
//   POST /api/auth/login            check password + role, returns a token
//   POST /api/auth/forgot-password  always the same answer
//   GET  /api/auth/me               who the token belongs to

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");
const { env } = require("../config/env");
const { ROLES, ROLE_LABELS, isKnownRole } = require("../config/roles");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendAuth = (res, user, status, message) =>
  res.status(status).json({ success: true, message, token: signToken(user), user });

// POST /api/auth/signup   
const signup = asyncHandler(async (req, res) => {
  const { name, childName, email, password, role, teacherCode } = req.body || {};
  if (!isKnownRole(role)) throw new AppError("Choose your role.", 400);


  if (role === ROLES.TEACHER && env.teacherSignupCode && String(teacherCode ?? "").trim() !== env.teacherSignupCode) {
    throw new AppError("Ask your school for the teacher sign-up code.", 403);
  }

  const isFamily = role === ROLES.CHILD_PARENT;
  if (!name?.trim() || !email || !password || (isFamily && !childName?.trim())) {
    throw new AppError("Fill in every field.", 400);
  }
  if (!EMAIL_PATTERN.test(email)) throw new AppError("Enter a valid email address.", 400);
  if (String(password).length < 6) throw new AppError("Use a password with at least 6 characters.", 400);


  if (await User.exists({ email: String(email).trim().toLowerCase() })) {
    throw new AppError("This email already has an account. Log in instead.", 409);
  }
  const user = await User.create({
    name: name.trim(),
    email,
    password, 
    role,
    details: { parentSettings: { childName: isFamily ? childName.trim() : "" } },
  });

  sendAuth(res, user, 201, "Account created");
});

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) throw new AppError("Enter your email and password.", 400);
  if (!isKnownRole(role)) throw new AppError("Choose your role.", 400);

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");

  
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Email or password is not correct.", 401);
  }
  
  if (user.role !== role) {
    throw new AppError(`This account is registered as "${ROLE_LABELS[user.role]}". Choose that role and try again.`, 403);
  }

  sendAuth(res, user, 200, "Logged in");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!EMAIL_PATTERN.test(email || "")) throw new AppError("Enter a valid email address.", 400);
  
  res.json({ success: true, message: "If an account uses this email, a reset link is on its way." });
});


const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { signup, login, forgotPassword, me };
