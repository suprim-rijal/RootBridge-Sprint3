const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/token");

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new AppError("Please log in first.", 401);

  const payload = verifyToken(token); // JWT errors are turned into 401s by errorHandler
  const user = await User.findById(payload.sub);
  if (!user)
    throw new AppError(
      "This account no longer exists. Please log in again.",
      401,
    );

  req.user = user;
  next();
});

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError("Please log in first.", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Your account type cannot use this.", 403));
    }
    next();
  };
}

module.exports = { protect, requireRole };
