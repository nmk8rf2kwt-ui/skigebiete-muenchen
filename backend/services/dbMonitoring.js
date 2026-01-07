import { supabase } from './db.js';
import { statusLogger } from './statusLogger.js';
import logger from './logger.js';

/**
 * Database Health Monitoring Service
 * Monitors Supabase database size, connections, and performance
 */

// Thresholds
const THRESHOLDS = {
    DATABASE_SIZE_WARNING: 400 * 1024 * 1024, // 400 MB (80% of 500MB limit)
    DATABASE_SIZE_CRITICAL: 450 * 1024 * 1024, // 450 MB (90% of 500MB limit)
    TRAFFIC_LOGS_MAX_AGE_DAYS: 30, // Keep traffic logs for 30 days
    SNAPSHOTS_MAX_AGE_DAYS: 90, // Keep snapshots for 90 days
    CONNECTION_WARNING: 50, // Warn if connections > 50
};

/**
 * Get database size estimate
 * @returns {Promise<Object>} Size information
 */
export async function getDatabaseSize() {
    if (!supabase) return { error: 'No database connection' };

    try {
        // Get table sizes using pg_total_relation_size
        const { data, error } = await supabase.rpc('get_table_sizes');

        if (error) {
            // Fallback: Count rows and estimate
            console.warn('RPC get_table_sizes not available, using row count estimation');
            return await estimateDatabaseSize();
        }

        const totalSize = data.reduce((sum, table) => sum + parseInt(table.size), 0);

        return {
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            percentUsed: ((totalSize / (500 * 1024 * 1024)) * 100).toFixed(1),
            tables: data,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error getting database size:', error);
        return { error: error.message };
    }
}

/**
 * Estimate database size by counting rows
 */
async function estimateDatabaseSize() {
    try {
        const tables = [
            { name: 'traffic_logs', avgRowSize: 100 },
            { name: 'resort_snapshots', avgRowSize: 500 },
            { name: 'resorts', avgRowSize: 300 },
            { name: 'cities', avgRowSize: 100 }
        ];

        let totalEstimate = 0;
        const tableDetails = [];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null) {
                const estimatedSize = count * table.avgRowSize;
                totalEstimate += estimatedSize;
                tableDetails.push({
                    table_name: table.name,
                    row_count: count,
                    estimated_size: estimatedSize,
                    size_mb: (estimatedSize / (1024 * 1024)).toFixed(2)
                });
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

    } catch (error) {
        console.error('Error estimating database size:', error);
        return { error: error.message };
    }
}

/**
 * Check database health and trigger alerts if needed
 */
export async function checkDatabaseHealth() {
    const sizeInfo = await getDatabaseSize();

    if (sizeInfo.error) {
        statusLogger.log('error', 'database', `Health check failed: ${sizeInfo.error}`);
        return { status: 'error', message: sizeInfo.error };
    }

    const sizeMB = parseFloat(sizeInfo.totalSizeMB);
    const percentUsed = parseFloat(sizeInfo.percentUsed);

    // Check size thresholds
    if (sizeInfo.totalSize >= THRESHOLDS.DATABASE_SIZE_CRITICAL) {
        statusLogger.log('error', 'database',
            `⚠️ CRITICAL: Database size ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        statusLogger.updateComponentStatus('database', 'degraded');
        return {
            status: 'critical',
            message: `Database size critical: ${sizeMB} MB`,
            action: 'Immediate cleanup required',
            sizeInfo
        };
    } else if (sizeInfo.totalSize >= THRESHOLDS.DATABASE_SIZE_WARNING) {
        statusLogger.log('warn', 'database',
            `⚠️ WARNING: Database size ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        return {
            status: 'warning',
            message: `Database size approaching limit: ${sizeMB} MB`,
            action: 'Consider cleanup soon',
            sizeInfo
        };
    } else {
        statusLogger.log('info', 'database',
            `Database size: ${sizeMB} MB (${percentUsed}% of 500MB limit)`);
        return {
            status: 'healthy',
            message: `Database size OK: ${sizeMB} MB`,
            sizeInfo
        };
    }
}

/**
 * Cleanup old traffic logs
 * @param {number} daysToKeep - Number of days to keep
 * @returns {Promise<number>} Number of deleted rows
 */
export async function cleanupOldTrafficLogs(daysToKeep = 30) {
    if (!supabase) return 0;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const { data, error } = await supabase
            .from('traffic_logs')
            .delete()
            .lt('timestamp', cutoffDate.toISOString());

        if (error) throw error;

        const deletedCount = data?.length || 0;

        if (deletedCount > 0) {
            statusLogger.log('info', 'database',
                `Cleaned up ${deletedCount} old traffic logs (older than ${daysToKeep} days)`);
        }

        return deletedCount;

    } catch (error) {
        console.error('Error cleaning up traffic logs:', error);
        statusLogger.log('error', 'database', `Cleanup failed: ${error.message}`);
        return 0;
    }
}

/**
 * Cleanup old snapshots
 * @param {number} daysToKeep - Number of days to keep
 * @returns {Promise<number>} Number of deleted rows
 */
export async function cleanupOldSnapshots(daysToKeep = 90) {
    if (!supabase) return 0;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('resort_snapshots')
            .delete()
            .lt('date', cutoffDateStr);

        if (error) throw error;

        const deletedCount = data?.length || 0;

        if (deletedCount > 0) {
            statusLogger.log('info', 'database',
                `Cleaned up ${deletedCount} old snapshots (older than ${daysToKeep} days)`);
        }

        return deletedCount;

    } catch (error) {
        console.error('Error cleaning up snapshots:', error);
        statusLogger.log('error', 'database', `Snapshot cleanup failed: ${error.message}`);
        return 0;
    }
}

/**
 * Run automated maintenance
 */
export async function runDatabaseMaintenance() {
    logger.db.info('🔧 Running database maintenance...');

    // 1. Check health
    const health = await checkDatabaseHealth();

    // 2. Cleanup if needed
    if (health.status === 'warning' || health.status === 'critical') {
        console.log('⚠️ Database size high, running cleanup...');
        const trafficDeleted = await cleanupOldTrafficLogs(THRESHOLDS.TRAFFIC_LOGS_MAX_AGE_DAYS);
        const snapshotsDeleted = await cleanupOldSnapshots(THRESHOLDS.SNAPSHOTS_MAX_AGE_DAYS);

        console.log(`✅ Cleanup complete: ${trafficDeleted} traffic logs, ${snapshotsDeleted} snapshots deleted`);

        // Re-check health
        const newHealth = await checkDatabaseHealth();
        return {
            ...newHealth,
            cleanupPerformed: true,
            trafficDeleted,
            snapshotsDeleted
        };
    }

    return health;
}
