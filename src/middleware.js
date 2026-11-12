function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = Number(err.status || err.statusCode || 500);
  res.status(status).json({
    success: false,
    error: status >= 500 ? "Internal server error." : (err.message || "Request failed.")
  });
}

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return res.status(503).json({ success: false, error: "Admin API is not configured." });
  const supplied = req.get("x-admin-key");
  if (!supplied || supplied !== expected) {
    return res.status(401).json({ success: false, error: "Unauthorized." });
  }
  next();
}

module.exports = { notFound, errorHandler, requireAdmin };
