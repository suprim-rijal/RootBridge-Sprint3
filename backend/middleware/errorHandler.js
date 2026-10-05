// =====================================================================
// Turns every error into the same clean shape: { success: false, error }
// Must be registered last, after all routes.
// =====================================================================
const { env } = require("../config/env");

function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express needs all 4 parameters
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong on the server";

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON";
  } else if (err.name === "ValidationError") {
    // Mongoose: a field broke its rules (required, enum, match, min/max)
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Some fields are not valid.";
  } else if (err.name === "CastError") {
    // Mongoose: an id or value of the wrong type
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    // MongoDB: a unique field already exists
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || (/email/i.test(err.message) ? "email" : "");
    message = field === "email" ? "This email already has an account. Log in instead." : `That ${field || "value"} is already taken.`;
  } else if (err.name === "MulterError") {
    // File upload problems (multer)
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "That file is larger than 10 MB." : `Upload problem: ${err.message}`;
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Your login is not valid. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Your login has expired. Please log in again.";
  }

  // Real crashes are logged in full; expected errors stay quiet.
  if (status >= 500) console.error(err);

  res.status(status).json({ success: false, error: status >= 500 && env.isProduction ? "Something went wrong on the server" : message });
}

module.exports = { notFound, errorHandler };
