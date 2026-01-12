/**
 * Prevents XSS by escaping HTML special characters.
 * @param {string} unsafe - The string to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    if (typeof unsafe !== 'string') return String(unsafe);

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Calculates the distance between two coordinates in km using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in km
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}
/**
 * Track an affiliate link click via a simple reach-out beacon
 * @param {string} resortId 
 * @param {string} type 
 */
export function trackClick(resortId, type) {
    const url = `/api/tracking/click?resortId=${encodeURIComponent(resortId)}&type=${encodeURIComponent(type)}`;
    // navigator.sendBeacon is ideal for tracking clicks as it's non-blocking
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
    } else {
        fetch(url, { mode: 'no-cors' }).catch(() => { });
    }
}

/**
 * Logs messages only if debug mode is active (via URL param ?debug=true)
 */
export function debugLog(message, ...args) {
    const isDebug = new URLSearchParams(window.location.search).has('debug');
    if (isDebug) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}

export function debugGroup(label) {
    const isDebug = new URLSearchParams(window.location.search).has('debug');
    if (isDebug) {
        console.group(label);
    }
}

export function debugGroupEnd() {
    const isDebug = new URLSearchParams(window.location.search).has('debug');
    if (isDebug) {
        console.groupEnd();
    }
}
