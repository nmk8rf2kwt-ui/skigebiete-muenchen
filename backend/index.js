import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// -- Sentry Init --
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  console.log("🛡️ Sentry initialized");
}

import { parserCache } from "./services/cache.js";
import { getStaticResorts } from "./services/resorts/service.js";
import { initScheduler } from "./services/scheduler.js";
import logger from "./services/logger.js";
import { basicAuth } from "./middleware/auth.js";

// Consolidated Routers
import resortsRouter from "./routes/resorts.js";
import { weatherRouter, historicalWeatherRouter } from "./routes/weather.js";
import { historyRouter, trafficAnalysisRouter } from "./routes/archive.js";
import { statusRouter, dbHealthRouter } from "./routes/system.js";
import { statusLogger, checkDatabaseHealth, webcamMonitor } from "./services/system/monitoring.js";
import { sentryService } from "./services/integrations/sentry.js";
import githubService from "./services/integrations/github.js"; // Added githubService import
import routingRouter from "./routes/routing.js";
import locatingRouter from "./routes/locating.js";
import adminRouter from "./routes/admin.js";
import trackingRouter from "./routes/tracking.js";
import sleddingRouter from "./routes/sledding.js";
import skitoursRouter from "./routes/skitours.js";
import iceSkatingRouter from "./routes/ice-skating.js";
import winterWalksRouter from "./routes/winter-walks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Trust proxy for Render.com (fixes rate-limit X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com", "js-de.sentry-cdn.com", "browser.sentry-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "unpkg.com", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "w7.weather.com.cn", "foto-webcam.eu"],
      connectSrc: ["'self'", "https://api.open-meteo.com", "*.sentry.io"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
}));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || !IS_PROD) return callback(null, true);
    if (origin.endsWith(".github.io") || origin.includes("skigebiete-muenchen")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Serve Static Files
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));
app.use('/admin', basicAuth, express.static(path.join(__dirname, '../admin')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

// -- API ROUTES --

// Health check with data freshness info
app.get("/health", (req, res) => {
  const resorts = getStaticResorts();
  const parserStats = parserCache.getStats();

  // Import weather and traffic caches for stats
  import("./services/cache.js").then(({ weatherCache, trafficCache }) => {
    const weatherStats = weatherCache.getStats();
    const trafficStats = trafficCache.getStats();

    // Consider "ready" when we have at least 50% of resorts cached
    const minReady = Math.floor(resorts.length * 0.5);
    const isReady = parserStats.valid >= minReady && weatherStats.valid >= minReady;

    res.json({
      status: "ok",
      ready: isReady,
      version: "1.10.1",
      service: "skigebiete-backend",
      resorts: resorts.length,
      cache: {
        parser: parserStats,
        weather: weatherStats,
        traffic: trafficStats
      },
      timestamp: new Date().toISOString()
    });
  }).catch(() => {
    // Fallback if import fails
    res.json({
      status: "ok",
      ready: parserStats.valid > 0,
      version: "1.10.1",
      service: "skigebiete-backend",
      resorts: resorts.length,
      cache: { parser: parserStats },
      timestamp: new Date().toISOString()
    });
  });
});

app.use("/api/resorts", resortsRouter);
app.use("/api/lifts", resortsRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/historical-weather", historicalWeatherRouter);
app.use("/api/traffic-analysis", trafficAnalysisRouter);
app.use("/api/routing", routingRouter);
app.use("/api/locating", locatingRouter);
app.use("/api/status", statusRouter);
app.use("/api/db-health", basicAuth, dbHealthRouter);
app.use("/api/admin", basicAuth, adminRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/sledding", sleddingRouter);
app.use("/api/skitours", skitoursRouter);
app.use("/api/ice-skating", iceSkatingRouter);
app.use("/api/winter-walks", winterWalksRouter);
app.use("/api", historyRouter);

// Initialize Services
initScheduler();
import('./services/system/monitoring.js').then(({ initWebcamMonitoring }) => {
  initWebcamMonitoring(6);
});

// Sentry Error Handler
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT} (v1.10.1)`);

  import("./services/system/monitoring.js").then(({ statusLogger }) => {
    statusLogger.log('info', 'system', `Server started on port ${PORT}`);
    statusLogger.updateComponentStatus('system', 'healthy');
  });
});
