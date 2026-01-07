import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { parserCache } from "./services/cache.js";
import { getStaticResorts } from "./services/resortManager.js";
import { initScheduler } from "./services/scheduler.js";
import logger from "./services/logger.js";

// Routes
import resortsRouter, { liftsRouter } from "./routes/resorts.js";
import weatherRouter from "./routes/weather.js";
import historyRouter from "./routes/history.js";
import trafficRouter from "./routes/traffic.js";
import trafficAnalysisRouter from "./routes/trafficAnalysis.js";
import historicalWeatherRouter from "./routes/historicalWeather.js";
import statusRouter from "./routes/status.js";

// -- PATH SAFETY & STATIC CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

logger.info('Starting Skigebiete Backend Server...', { port: PORT, env: process.env.NODE_ENV });

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
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "unpkg.com", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "w7.weather.com.cn", "foto-webcam.eu"],
      connectSrc: ["'self'", "https://api.open-meteo.com"], // Allow weather API
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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
    if (!origin) return callback(null, true);
    if (IS_PROD) {
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".github.io")) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  }
}));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../')));



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
app.use("/api/traffic", trafficRouter);
app.use("/api/traffic-analysis", trafficAnalysisRouter);
app.use("/api/historical-weather", historicalWeatherRouter);
app.use("/api/status", statusRouter); // Must be before /api (history) to avoid /:resortId match
app.use("/api", historyRouter); // mounts /history, /trends

// Initialize Scheduler (Weather & History)
initScheduler();

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
