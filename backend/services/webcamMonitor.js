import { fetchWithHeaders } from '../utils/fetcher.js';
import { getStaticResorts } from './resortManager.js';

/**
 * Webcam Health Monitoring Service
 * Checks all webcam links for availability and tracks their status
 */

class WebcamMonitor {
    constructor() {
        this.status = new Map(); // resortId -> { url, status, lastCheck, statusCode, error }
        this.lastFullCheck = null;
    }

    /**
     * Check a single webcam URL
     */
    async checkWebcam(url, timeout = 10000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'HEAD', // Use HEAD to avoid downloading full page
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SkiResortMonitor/1.0)'
                }
            });

            clearTimeout(timeoutId);

            return {
                available: response.ok,
                statusCode: response.status,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    available: false,
                    statusCode: null,
                    error: 'Timeout'
                };
            }
            return {
                available: false,
                statusCode: null,
                error: error.message
            };
        }
    }

    /**
     * Check all webcam links
     */
    async checkAllWebcams() {
        const resorts = getStaticResorts();
        const results = [];

        console.log(`🔍 Checking ${resorts.length} resorts for webcam availability...`);

        for (const resort of resorts) {
            if (!resort.webcam) {
                this.status.set(resort.id, {
                    url: null,
                    status: 'missing',
                    lastCheck: new Date(),
                    statusCode: null,
                    error: 'No webcam URL configured'
                });
                results.push({
                    resortId: resort.id,
                    resortName: resort.name,
                    status: 'missing'
                });
                continue;
            }

            const result = await this.checkWebcam(resort.webcam);
            
            this.status.set(resort.id, {
                url: resort.webcam,
                status: result.available ? 'ok' : 'error',
                lastCheck: new Date(),
                statusCode: result.statusCode,
                error: result.error
            });

            results.push({
                resortId: resort.id,
                resortName: resort.name,
                url: resort.webcam,
                status: result.available ? 'ok' : 'error',
                statusCode: result.statusCode,
                error: result.error
            });

            // Small delay to avoid overwhelming servers
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.lastFullCheck = new Date();

        const summary = {
            total: results.length,
            ok: results.filter(r => r.status === 'ok').length,
            error: results.filter(r => r.status === 'error').length,
            missing: results.filter(r => r.status === 'missing').length,
            lastCheck: this.lastFullCheck
        };

        console.log(`✅ Webcam check complete: ${summary.ok} OK, ${summary.error} errors, ${summary.missing} missing`);

        return {
            summary,
            results
        };
    }

    /**
     * Get current status
     */
    getStatus() {
        const statusArray = Array.from(this.status.entries()).map(([resortId, data]) => ({
            resortId,
            ...data
        }));

        return {
            lastCheck: this.lastFullCheck,
            webcams: statusArray,
            summary: {
                total: statusArray.length,
                ok: statusArray.filter(w => w.status === 'ok').length,
                error: statusArray.filter(w => w.status === 'error').length,
                missing: statusArray.filter(w => w.status === 'missing').length
            }
        };
    }

    /**
     * Get problematic webcams (errors or missing)
     */
    getProblematicWebcams() {
        return Array.from(this.status.entries())
            .filter(([_, data]) => data.status !== 'ok')
            .map(([resortId, data]) => ({
                resortId,
                ...data
            }));
    }
}

// Singleton instance
export const webcamMonitor = new WebcamMonitor();

/**
 * Initialize webcam monitoring with scheduled checks
 */
export function initWebcamMonitoring(intervalHours = 6) {
    console.log(`📹 Initializing webcam monitoring (check every ${intervalHours}h)...`);
    
    // Initial check
    webcamMonitor.checkAllWebcams();
    
    // Schedule regular checks
    const intervalMs = intervalHours * 60 * 60 * 1000;
    setInterval(() => {
        console.log('📹 Running scheduled webcam check...');
        webcamMonitor.checkAllWebcams();
    }, intervalMs);
}
