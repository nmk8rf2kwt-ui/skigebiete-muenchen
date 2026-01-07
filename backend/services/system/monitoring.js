import { supabase } from '../db.js';
import logger from '../logger.js';
import { fetchWithHeaders } from '../../utils/fetcher.js';
import { getStaticResorts } from '../resorts/service.js';

/**
 * 1. STATUS LOGGER
 * Simple in-memory logger for system status events
 */
class StatusLogger {
    constructor(limit = 50) {
        this.limit = limit;
        this.logs = [];
        this.components = {
            database: 'unknown',
            scraper: 'unknown',
            weather: 'unknown',
            traffic: 'unknown',
            geocoding: 'unknown',
            scheduler: 'unknown',
            traffic_analysis: 'unknown'
        };
        this.metrics = {
            traffic_data_points: 0,
            traffic_last_update: null,
            db_size_mb: 0,
            db_percent_used: 0
        };
    }

    log(level, component, message) {
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            level,
            component,
            message
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.limit) {
            this.logs = this.logs.slice(0, this.limit);
        }

        if (level === 'error') {
            this.updateComponentStatus(component, 'degraded');
        } else if (level === 'success') {
            this.updateComponentStatus(component, 'healthy');
        }

        const icon = level === 'error' ? '❌' : (level === 'warn' ? '⚠️' : (level === 'success' ? '✅' : 'ℹ️'));
        console.log(`${icon} [${component.toUpperCase()}] ${message}`);

        const logLevel = level === 'success' ? 'info' : level;
        logger.log(logLevel, message, { component, icon });
    }

    updateComponentStatus(component, status) {
        if (this.components[component]) {
            this.components[component] = status;
        }
    }

    getLogs() { return this.logs; }
    getStatus() { return this.components; }
    getMetrics() { return this.metrics; }
    updateMetric(key, value) {
        if (Object.prototype.hasOwnProperty.call(this.metrics, key)) {
            this.metrics[key] = value;
        }
    }
}

export const statusLogger = new StatusLogger();

/**
 * 2. DATABASE MONITORING
 */
const DB_THRESHOLDS = {
    DATABASE_SIZE_WARNING: 400 * 1024 * 1024,
    DATABASE_SIZE_CRITICAL: 450 * 1024 * 1024,
    TRAFFIC_LOGS_MAX_AGE_DAYS: 30,
    SNAPSHOTS_MAX_AGE_DAYS: 90,
};

export async function getDatabaseSize() {
    if (!supabase) return { error: 'No database connection' };
    try {
        const { data, error } = await supabase.rpc('get_table_sizes');
        if (error) return await estimateDatabaseSize();

        const totalSize = data.reduce((sum, table) => sum + parseInt(table.size), 0);
        return {
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            percentUsed: ((totalSize / (500 * 1024 * 1024)) * 100).toFixed(1),
            tables: data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { error: error.message };
    }
}

async function estimateDatabaseSize() {
    const tables = [
        { name: 'traffic_logs', avgRowSize: 100 },
        { name: 'resort_snapshots', avgRowSize: 500 },
        { name: 'resorts', avgRowSize: 300 },
        { name: 'cities', avgRowSize: 100 }
    ];
    let totalEstimate = 0;
    const tableDetails = [];
    for (const table of tables) {
        const { count, error } = await supabase.from(table.name).select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
            const estimatedSize = count * table.avgRowSize;
            totalEstimate += estimatedSize;
            tableDetails.push({ table_name: table.name, row_count: count, estimated_size: estimatedSize, size_mb: (estimatedSize / (1024 * 1024)).toFixed(2) });
        }
    }
    return {
        totalSize: totalEstimate,
        totalSizeMB: (totalEstimate / (1024 * 1024)).toFixed(2),
        percentUsed: ((totalEstimate / (500 * 1024 * 1024)) * 100).toFixed(1),
        tables: tableDetails,
        estimated: true,
        timestamp: new Date().toISOString()
    };
}

export async function checkDatabaseHealth() {
    const sizeInfo = await getDatabaseSize();
    if (sizeInfo.error) {
        statusLogger.log('error', 'database', `Health check failed: ${sizeInfo.error}`);
        return { status: 'error', message: sizeInfo.error };
    }
    const sizeMB = parseFloat(sizeInfo.totalSizeMB);
    const percentUsed = parseFloat(sizeInfo.percentUsed);

    if (sizeInfo.totalSize >= DB_THRESHOLDS.DATABASE_SIZE_CRITICAL) {
        statusLogger.log('error', 'database', `⚠️ CRITICAL: Database size ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        statusLogger.updateComponentStatus('database', 'degraded');
        return { status: 'critical', message: `Database size critical: ${sizeMB} MB`, action: 'Immediate cleanup required', sizeInfo };
    } else if (sizeInfo.totalSize >= DB_THRESHOLDS.DATABASE_SIZE_WARNING) {
        statusLogger.log('warn', 'database', `⚠️ WARNING: Database size ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        return { status: 'warning', message: `Database size approaching limit: ${sizeMB} MB`, action: 'Consider cleanup soon', sizeInfo };
    } else {
        statusLogger.log('info', 'database', `Database size: ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        return { status: 'healthy', message: `Database size OK: ${sizeMB} MB`, sizeInfo };
    }
}

export async function cleanupOldTrafficLogs(daysToKeep = 30) {
    if (!supabase) return 0;
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const { data, error } = await supabase.from('traffic_logs').delete().lt('timestamp', cutoffDate.toISOString());
        if (error) throw error;
        const deletedCount = data?.length || 0;
        if (deletedCount > 0) statusLogger.log('info', 'database', `Cleaned up ${deletedCount} old traffic logs`);
        return deletedCount;
    } catch (error) {
        statusLogger.log('error', 'database', `Cleanup failed: ${error.message}`);
        return 0;
    }
}

export async function cleanupOldSnapshots(daysToKeep = 90) {
    if (!supabase) return 0;
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        const { data, error } = await supabase.from('resort_snapshots').delete().lt('date', cutoffDateStr);
        if (error) throw error;
        const deletedCount = data?.length || 0;
        if (deletedCount > 0) statusLogger.log('info', 'database', `Cleaned up ${deletedCount} old snapshots`);
        return deletedCount;
    } catch (error) {
        statusLogger.log('error', 'database', `Snapshot cleanup failed: ${error.message}`);
        return 0;
    }
}

export async function runDatabaseMaintenance() {
    logger.db.info('🔧 Running database maintenance...');
    const health = await checkDatabaseHealth();
    if (health.status === 'warning' || health.status === 'critical') {
        const tDeleted = await cleanupOldTrafficLogs(DB_THRESHOLDS.TRAFFIC_LOGS_MAX_AGE_DAYS);
        const sDeleted = await cleanupOldSnapshots(DB_THRESHOLDS.SNAPSHOTS_MAX_AGE_DAYS);
        const newHealth = await checkDatabaseHealth();
        return { ...newHealth, cleanupPerformed: true, trafficDeleted: tDeleted, snapshotsDeleted: sDeleted };
    }
    return health;
}

/**
 * 3. WEBCAM MONITORING
 */
class WebcamMonitor {
    constructor() {
        this.status = new Map();
        this.lastFullCheck = null;
    }

    async checkWebcam(url, timeout = 10000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetchWithHeaders(url, { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);
            return { available: response.ok, statusCode: response.status, error: response.ok ? null : `HTTP ${response.status}` };
        } catch (error) {
            return { available: false, statusCode: null, error: error.name === 'AbortError' ? 'Timeout' : error.message };
        }
    }

    async checkAllWebcams() {
        const resorts = getStaticResorts();
        const results = [];
        for (const resort of resorts) {
            if (!resort.webcam) {
                this.status.set(resort.id, { url: null, status: 'missing', lastCheck: new Date(), error: 'No webcam URL' });
                results.push({ resortId: resort.id, status: 'missing' });
                continue;
            }
            const result = await this.checkWebcam(resort.webcam);
            this.status.set(resort.id, { url: resort.webcam, status: result.available ? 'ok' : 'error', lastCheck: new Date(), statusCode: result.statusCode, error: result.error });
            results.push({ resortId: resort.id, status: result.available ? 'ok' : 'error' });
            await new Promise(r => setTimeout(r, 200));
        }
        this.lastFullCheck = new Date();
        return { results };
    }

    getStatus() {
        const webcams = Array.from(this.status.entries()).map(([resortId, data]) => ({ resortId, ...data }));
        return {
            lastCheck: this.lastFullCheck,
            webcams,
            summary: { total: webcams.length, ok: webcams.filter(w => w.status === 'ok').length, error: webcams.filter(w => w.status === 'error').length, missing: webcams.filter(w => w.status === 'missing').length }
        };
    }
}

export const webcamMonitor = new WebcamMonitor();

export function initWebcamMonitoring(intervalHours = 6) {
    webcamMonitor.checkAllWebcams();
    setInterval(() => webcamMonitor.checkAllWebcams(), intervalHours * 60 * 60 * 1000);
}
