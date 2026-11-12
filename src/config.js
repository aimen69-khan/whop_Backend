const path = require("path");

function csv(value = "") {
  return value.split(",").map(v => v.trim()).filter(Boolean);
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: csv(process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"),
  adminApiKey: process.env.ADMIN_API_KEY || "",
  dataFile: path.resolve(process.cwd(), process.env.DATA_FILE || "./data/leads.json"),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100)
};