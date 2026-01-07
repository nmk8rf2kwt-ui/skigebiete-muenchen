import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory
const LOG_DIR = path.join(__dirname, '../logs');

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
        const componentStr = component ? `[${component.toUpperCase()}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${componentStr} ${message} ${metaStr}`;
    })
);

// JSON format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { service: 'skigebiete-backend' },
    transports: [
        // Error log - only errors
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),

        // Combined log - everything
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),

        // Console output (only in development)
        // Console output
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? fileFormat : consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            handleExceptions: true,
            handleRejections: true
        })
    ],
    exitOnError: false // Do not exit on handled exceptions
});

// Add specialized transports for specific components
const scraperTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'scraper-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
    level: 'info'
});

const trafficTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'traffic-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '7d',
    zippedArchive: true,
    level: 'info'
});

// Helper functions for component-specific logging
export const scraperLogger = {
    info: (message, meta = {}) => logger.info(message, { component: 'scraper', ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: 'scraper', ...meta }),
    error: (message, meta = {}) => logger.error(message, { component: 'scraper', ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: 'scraper', ...meta })
};

export const trafficLogger = {
    info: (message, meta = {}) => logger.info(message, { component: 'traffic', ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: 'traffic', ...meta }),
    error: (message, meta = {}) => logger.error(message, { component: 'traffic', ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: 'traffic', ...meta })
};

export const weatherLogger = {
    info: (message, meta = {}) => logger.info(message, { component: 'weather', ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: 'weather', ...meta }),
    error: (message, meta = {}) => logger.error(message, { component: 'weather', ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: 'weather', ...meta })
};

export const dbLogger = {
    info: (message, meta = {}) => logger.info(message, { component: 'database', ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: 'database', ...meta }),
    error: (message, meta = {}) => logger.error(message, { component: 'database', ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: 'database', ...meta })
};

export const schedulerLogger = {
    info: (message, meta = {}) => logger.info(message, { component: 'scheduler', ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: 'scheduler', ...meta }),
    error: (message, meta = {}) => logger.error(message, { component: 'scheduler', ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: 'scheduler', ...meta })
};

// Add component-specific transports
logger.add(scraperTransport);
logger.add(trafficTransport);

// Attach component loggers to the main logger instance
logger.scraper = scraperLogger;
logger.traffic = trafficLogger;
logger.weather = weatherLogger;
logger.db = dbLogger;
logger.scheduler = schedulerLogger;

// Export the main logger
export default logger;
