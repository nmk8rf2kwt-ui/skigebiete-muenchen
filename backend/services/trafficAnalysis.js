import { supabase } from './db.js';

/**
 * Traffic Analysis Service
 * Analyzes historical traffic data to identify peak congestion times
 */

/**
 * Get top 5 congestion times for a specific resort across all cities
 * @param {string} resortId - Resort ID
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Object} Analysis results with top 5 congestion times
 */
export async function getResortCongestionAnalysis(resortId, days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Query: Get all traffic data for this resort from all cities
        const { data, error } = await supabase
            .from('matrix_traffic_logs')
            .select('*')
            .eq('resort_id', resortId)
            .gte('timestamp', startDate.toISOString())
            .order('delay', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            return {
                hasData: false,
                minDataPoints: 100,
                currentDataPoints: 0,
                message: 'Insufficient data for analysis'
            };
        }

        // Check if we have enough data (at least 100 data points for reliable analysis)
        if (data.length < 100) {
            return {
                hasData: false,
                minDataPoints: 100,
                currentDataPoints: data.length,
                message: `Collecting data... ${data.length}/100 data points`
            };
        }

        // Group by weekday and hour
        const congestionByTime = {};

        data.forEach(entry => {
            const timestamp = new Date(entry.timestamp);
            const weekday = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
            const hour = timestamp.getHours();
            const delay = entry.delay || 0;

            // Only consider significant delays (> 5 minutes)
            if (delay <= 5) return;

            const key = `${weekday}-${hour}`;

            if (!congestionByTime[key]) {
                congestionByTime[key] = {
                    weekday,
                    hour,
                    delays: [],
                    cityBreakdown: {}
                };
            }

            congestionByTime[key].delays.push(delay);

            // Track which cities contribute to congestion
            if (!congestionByTime[key].cityBreakdown[entry.city_name]) {
                congestionByTime[key].cityBreakdown[entry.city_name] = [];
            }
            congestionByTime[key].cityBreakdown[entry.city_name].push(delay);
        });

        // Calculate averages and sort
        const timeSlots = Object.values(congestionByTime).map(slot => {
            const avgDelay = slot.delays.reduce((a, b) => a + b, 0) / slot.delays.length;
            const maxDelay = Math.max(...slot.delays);

            // Calculate city-specific averages
            const cityStats = {};
            Object.entries(slot.cityBreakdown).forEach(([city, delays]) => {
                cityStats[city] = {
                    avgDelay: Math.round(delays.reduce((a, b) => a + b, 0) / delays.length),
                    maxDelay: Math.max(...delays),
                    count: delays.length
                };
            });

            return {
                weekday: slot.weekday,
                weekdayName: getWeekdayName(slot.weekday),
                hour: slot.hour,
                hourRange: `${slot.hour.toString().padStart(2, '0')}:00 - ${(slot.hour + 1).toString().padStart(2, '0')}:00`,
                avgDelay: Math.round(avgDelay),
                maxDelay: Math.round(maxDelay),
                occurrences: slot.delays.length,
                cityStats
            };
        });

        // Sort by average delay and get top 5
        const top5 = timeSlots
            .sort((a, b) => b.avgDelay - a.avgDelay)
            .slice(0, 5);

        // Calculate overall statistics
        const overallAvgDelay = top5.length > 0
            ? Math.round(top5.reduce((sum, slot) => sum + slot.avgDelay, 0) / top5.length)
            : 0;

        return {
            hasData: true,
            resortId,
            analyzedDays: days,
            dataPoints: data.length,
            top5Congestion: top5,
            summary: {
                avgDelayTop5: overallAvgDelay,
                peakTime: top5[0] || null,
                totalOccurrences: top5.reduce((sum, slot) => sum + slot.occurrences, 0)
            }
        };

    } catch (error) {
        console.error('Error in congestion analysis:', error);
        throw error;
    }
}

/**
 * Get congestion analysis for all resorts
 * @param {number} days - Number of days to analyze
 * @returns {Object} Map of resortId to analysis
 */
export async function getAllResortsCongestionAnalysis(days = 7) {
    try {
        // Get unique resort IDs from traffic logs
        const { data: resorts, error } = await supabase
            .from('matrix_traffic_logs')
            .select('resort_id')
            .limit(1000);

        if (error) throw error;

        const uniqueResortIds = [...new Set(resorts.map(r => r.resort_id))];

        const analyses = {};

        for (const resortId of uniqueResortIds) {
            analyses[resortId] = await getResortCongestionAnalysis(resortId, days);
        }

        return analyses;

    } catch (error) {
        console.error('Error in bulk congestion analysis:', error);
        throw error;
    }
}

/**
 * Get weekday name from number
 */
function getWeekdayName(day) {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[day];
}

/**
 * Check if sufficient data exists for analysis
 * @param {string} resortId - Resort ID
 * @returns {Object} Data availability status
 */
export async function checkDataAvailability(resortId) {
    try {
        const { count, error } = await supabase
            .from('matrix_traffic_logs')
            .select('*', { count: 'exact', head: true })
            .eq('resort_id', resortId);

        if (error) throw error;

        return {
            resortId,
            dataPoints: count,
            hasEnoughData: count >= 100,
            progress: Math.min(100, Math.round((count / 100) * 100))
        };

    } catch (error) {
        console.error('Error checking data availability:', error);
        return {
            resortId,
            dataPoints: 0,
            hasEnoughData: false,
            progress: 0
        };
    }
}
