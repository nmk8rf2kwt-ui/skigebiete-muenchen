import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, 'fetch.log');

// Ensure log directory exists (Sync is fine here as it's one-time startup)
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR);
    } catch (err) {
        console.error("Failed to create log directory:", err);
    }
}

export function logFetch(resort, status, url, details = "") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${resort.toUpperCase()}] [${status.toUpperCase()}] [${url}] ${details}\n`;

    console.log(logEntry.trim()); // Also log to console

    // Async append
    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) {
            console.error("Failed to write to log file:", err.message);
        }
    });
}
