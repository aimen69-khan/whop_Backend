require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const config = require("./config");
const { add, readAll, ensureStore } = require("./store");
const { validateLead, services } = require("./validation");
const { notFound, errorHandler, requireAdmin } = require("./middleware");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

// --- CORS ---
// Origins must NOT have a trailing slash — browsers send bare origins.
// config.js strips trailing slashes at parse time.
const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server calls (no Origin header) and whitelisted origins
    if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  credentials: true
};

app.use(cors(corsOptions));

// Explicitly handle preflight for all routes so Vercel edge doesn't swallow OPTIONS
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

// --- Routes ---

app.get("/", (req, res) => {
  res.json({
    name: "Summit Roofing API",
    version: "1.0.0",
    status: "ok",
    endpoints: ["/api/health", "/api/services", "/api/plans", "/api/leads"]
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "summit-roofing-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/services", (req, res) => {
  res.json({
    success: true,
    services: [...services]
  });
});

app.get("/api/plans", (req, res) => {
  res.json({
    success: true,
    plans: [
      { key: "inspection", name: "Roof Inspection",  price: 149, currency: "USD", detail: "On-site inspection + photo report" },
      { key: "deposit",    name: "Project Deposit",  price: 500, currency: "USD", detail: "Reserve your approved roofing project" },
      { key: "flat",       name: "Roof Tune-Up",     price: 399, currency: "USD", detail: "Flat-rate minor maintenance visit" }
    ]
  });
});

app.post("/api/leads", async (req, res, next) => {
  try {
    // Honeypot: silently accept bot submissions that fill the hidden `website` field
    if (req.body && req.body.website) {
      return res.status(201).json({ success: true, message: "Estimate request received." });
    }

    const { lead, errors } = validateLead(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, error: errors[0], errors });
    }

    const record = {
      id: crypto.randomUUID(),
      ...lead,
      status: "new",
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await add(config.dataFile, record);

    return res.status(201).json({
      success: true,
      message: "Estimate request received.",
      lead: { id: record.id, status: record.status, createdAt: record.createdAt }
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/leads", requireAdmin, async (req, res, next) => {
  try {
    const leads = await readAll(config.dataFile);
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/leads/:id", requireAdmin, async (req, res, next) => {
  try {
    const leads = await readAll(config.dataFile);
    const lead = leads.find(item => item.id === req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: "Lead not found." });
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

app.patch("/api/admin/leads/:id", requireAdmin, async (req, res, next) => {
  try {
    const leads = await readAll(config.dataFile);
    const index = leads.findIndex(item => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: "Lead not found." });

    const allowed = new Set(["new", "contacted", "scheduled", "won", "lost"]);
    const status = String(req.body.status || "").trim();
    if (!allowed.has(status)) return res.status(400).json({ success: false, error: "Invalid status." });

    leads[index].status = status;
    leads[index].updatedAt = new Date().toISOString();
    const { writeAll } = require("./store");
    await writeAll(config.dataFile, leads);

    res.json({ success: true, lead: leads[index] });
  } catch (err) {
    next(err);
  }
});

app.use(notFound);
app.use(errorHandler);

// --- Server startup ---
// On Vercel (serverless) the module is imported — do NOT call listen().
// In local dev / a traditional host, listen normally.
if (require.main === module) {
  ensureStore(config.dataFile)
    .then(() => app.listen(config.port, () => {
      console.log(`Summit Roofing API listening on http://localhost:${config.port}`);
      console.log(`Allowed CORS origins: ${config.corsOrigins.join(", ")}`);
    }))
    .catch(err => {
      console.error("Could not initialize lead storage:", err);
      process.exit(1);
    });
}

// Export the app so Vercel can import it as a serverless function
module.exports = app;
