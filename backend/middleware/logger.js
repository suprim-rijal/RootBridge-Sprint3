// Prints one line per request, for example:
// [2026-09-15T10:00:00.000Z] GET /api/tracks -> 200 (4 ms)
function logger(req, res, next) {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms} ms)`);
  });
  next();
}

module.exports = logger;
