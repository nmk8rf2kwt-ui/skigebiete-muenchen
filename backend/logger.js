import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, 'fetch.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

export function logFetch(resort, status, url, details = "") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${resort.toUpperCase()}] [${status.toUpperCase()}] [${url}] ${details}\n`;

    console.log(logEntry.trim()); // Also log to console

    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}
