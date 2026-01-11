import { supabase } from './db.js';

/**
 * Log a click on an affiliate link (aggregated only)
 * @param {string} resortId - ID of the resort
 * @param {string} type - Type of link (ticket, transport, hotel)
 * @param {string} referrer - Optional referrer info
 */
export async function logAffiliateClick(resortId, type, referrer = 'frontend') {
    try {
        // We only store aggregated counts to respect privacy (no user IDs)
        // In a real scenario, we might use a separate table for daily stats
        const { error } = await supabase.rpc('increment_affiliate_click', {
            target_resort: resortId,
            link_type: type
        });

        if (error) {
            console.error('[Tracking] Supabase error:', error);
            // Fallback: log to file system for "Zero-DB-Crash" policy
            console.log(`[AFFILIATE_CLICK] ${resortId} | ${type} | ${new Date().toISOString()}`);
        }
    } catch (err) {
        console.error('[Tracking] Unexpected error:', err);
    }
}
