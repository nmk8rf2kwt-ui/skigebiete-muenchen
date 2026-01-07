import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// -- Sentry Init (Must be initialized before app creation) --
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions (adjust in production)
    // Profiling
    profilesSampleRate: 1.0,
  });
  console.log("🛡️ Sentry initialized and monitoring");
}

import { parserCache } from "./services/cache.js";
import { getStaticResorts } from "./services/resortManager.js";
import { initScheduler } from "./services/scheduler.js";
import logger from "./services/logger.js";

// Routes
import resortsRouter from "./routes/resorts.js";
import liftsRouter from "./routes/lifts.js";
import weatherRouter from "./routes/weather.js";
import historyRouter from "./routes/history.js";
import routingRouter from "./routes/routing.js";
import locatingRouter from "./routes/locating.js";
import trafficAnalysisRouter from "./routes/trafficAnalysis.js";
import historicalWeatherRouter from "./routes/historicalWeather.js";
import statusRouter from "./routes/status.js";
import dbHealthRouter from "./routes/dbHealth.js";
import adminRouter from "./routes/admin.js";
import { basicAuth } from "./middleware/auth.js";

// -- PATH SAFETY & STATIC CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Sentry v10 uses automatic instrumentation, no manual request handlers needed

const PORT = process.env.PORT || 10000;

// System Info Logging
logger.info('🚀 Starting Skigebiete Backend Server...', {
  port: PORT,
  env: process.env.NODE_ENV,
  nodeVersion: process.version,
  memory: process.memoryUsage(),
  platform: process.platform
});

// Environment Safety
const IS_PROD = process.env.NODE_ENV === 'production';
if (!IS_PROD) {
  console.log("🚧 Running in DEVELOPMENT mode");
} else {
  console.log("🔒 Running in PRODUCTION mode");
}


// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com", "js-de.sentry-cdn.com"], // Added Sentry CDN
      styleSrc: ["'self'", "'unsafe-inline'", "unpkg.com", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "w7.weather.com.cn", "foto-webcam.eu"],
      connectSrc: ["'self'", "https://api.open-meteo.com", "*.sentry.io"], // Allow Sentry ingest
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  "https://nmk8rf2kwt-ui.github.io",
  "https://philippgrubl.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow everything
    if (!IS_PROD) return callback(null, true);

    // In production, check allowed origins
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".github.io") || origin.includes("skigebiete-muenchen")) {
      callback(null, true);
    } else {
      // Log failed CORS attempts for debugging instead of crashing
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Protect Admin Area (Dashboard & API)
app.use("/admin", basicAuth);
app.use("/api/admin", basicAuth);

// Serve Static Frontend Files (Securely)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));
// Note: /admin is protected by basicAuth middleware defined above
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Root HTML Files (Explicit Whitelist)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/impressum.html', (req, res) => res.sendFile(path.join(__dirname, '../impressum.html')));
app.get('/datenschutz.html', (req, res) => res.sendFile(path.join(__dirname, '../datenschutz.html')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, '../robots.txt')));



// -- ROUTES --

// Health check
app.get("/health", (req, res) => {
  const resorts = getStaticResorts();
  const cacheStats = parserCache.getStats();
  res.json({
    status: "ok",
    version: "1.3.2",
    service: "skigebiete-backend",
    resorts: resorts.length,
    cache: cacheStats
  });
});

app.use(express.json()); // Enable JSON body parsing for POST

app.use("/api/resorts", resortsRouter);
app.use("/api/lifts", liftsRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/routing", routingRouter);
app.use("/api/locating", locatingRouter);
app.use("/api/traffic-analysis", trafficAnalysisRouter);
app.use("/api/historical-weather", historicalWeatherRouter);
app.use("/api/status", statusRouter); // Must be before /api (history) to avoid /:resortId match
app.use("/api/db-health", basicAuth, dbHealthRouter);
app.use("/api/admin", adminRouter);
app.use("/api", historyRouter); // mounts /history, /trends

// Initialize Scheduler (Weather & History)
initScheduler();

// Initialize Webcam Monitoring (check every 6 hours)
import('./services/webcamMonitor.js').then(({ initWebcamMonitoring }) => {
  initWebcamMonitoring(6); // Check every 6 hours
});

// Sentry Error Handler (v10 API)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📊 Historical data tracking enabled`);
  console.log(`🛡️ Security middleware enabled`);
  console.log(`📂 Serving static files from parent`);

  // Log startup
  import("./services/statusLogger.js").then(({ statusLogger }) => {
    statusLogger.log('info', 'system', `Server started on port ${PORT}`);
    statusLogger.updateComponentStatus('system', 'healthy');
  });
});
