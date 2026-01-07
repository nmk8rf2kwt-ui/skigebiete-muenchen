// Simple in-memory logger for system status events
// Keeps the last N events for display in the frontend dashboard

class StatusLogger {
    constructor(limit = 50) {
        this.limit = limit;
        this.logs = [];
        this.components = {
            database: 'unknown', // unknown, healthy, degraded, down
            scraper: 'unknown',
            weather: 'unknown',
            traffic: 'unknown',
            scheduler: 'unknown'
        };
    }

    /**
     * Log an event
     * @param {string} level - 'info', 'warn', 'error', 'success'
     * @param {string} component - 'db', 'scraper', 'weather', 'system'
     * @param {string} message - Description
     */
    log(level, component, message) {
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            level,
            component,
            message
        };

        // Add to front
        this.logs.unshift(entry);

        // Trim
        if (this.logs.length > this.limit) {
            this.logs = this.logs.slice(0, this.limit);
        }

        // Update component status based on recent logs? 
        // Or let components set their status explicitly.
        // For now, if error, maybe flag component? 
        // Let's rely on explicit status updates or derived from logs.
        if (level === 'error') {
            this.updateComponentStatus(component, 'degraded');
        } else if (level === 'success') {
            this.updateComponentStatus(component, 'healthy');
        }

        // Console output for dev
        const icon = level === 'error' ? '❌' : (level === 'warn' ? '⚠️' : (level === 'success' ? '✅' : 'ℹ️'));
        console.log(`${icon} [${component.toUpperCase()}] ${message}`);
    }

    updateComponentStatus(component, status) {
        if (this.components[component]) {
            this.components[component] = status;
        }
    }

    getLogs() {
        return this.logs;
    }

    getStatus() {
        return this.components;
    }
}

// Singleton
export const statusLogger = new StatusLogger();
