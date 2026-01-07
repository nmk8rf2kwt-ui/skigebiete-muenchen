/**
 * Sorting utilities for ski resort data
 * Handles sorting by various keys including traffic data and snow objects
 */

/**
 * Sort resorts by a given key and direction
 * @param {Array} data - Array of resort objects
 * @param {string} sortKey - Key to sort by
 * @param {string} sortDirection - 'asc' or 'desc'
 * @returns {Array} Sorted array of resorts
 */
export function sortResorts(data, sortKey, sortDirection = 'desc') {
    return [...data].sort((a, b) => {
        let valA, valB;

        // Resolve Sort Keys
        if (sortKey === 'distance_km') {
            valA = a.traffic?.distanceKm ?? a.distanceKm;
            valB = b.traffic?.distanceKm ?? b.distanceKm;
        } else if (sortKey === 'traffic_duration') {
            valA = a.traffic?.duration ?? a.distance;
            valB = b.traffic?.duration ?? b.distance;
        } else if (sortKey === 'traffic_delay') {
            valA = a.traffic?.delay ?? 0;
            valB = b.traffic?.delay ?? 0;
        } else if (sortKey === 'distance') { // Standard Time
            valA = a.distance;
            valB = b.distance;
        } else if (sortKey === 'snow') {
            // Handle Snow Object or String
            valA = getSnowDepth(a.snow);
            valB = getSnowDepth(b.snow);
        } else {
            valA = a[sortKey];
            valB = b[sortKey];
        }

        // Handle nulls/undefined first
        if (valA == null) valA = 0;
        if (valB == null) valB = 0;

        const multiplier = sortDirection === "asc" ? 1 : -1;

        // Start with special keys that REQUIRE numeric parsing from potential strings
        if (['snow', 'distance', 'piste_km', 'price', 'score', 'distance_km', 'traffic_duration', 'traffic_delay', 'liftsOpen'].includes(sortKey)) {
            return (getNumericValue(valA) - getNumericValue(valB)) * multiplier;
        }

        // Default numeric sort
        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * multiplier;
        }

        // Default string sort
        if (typeof valA === 'string') {
            return valA.localeCompare(valB.toString()) * multiplier;
        }

        return 0;
    });
}

/**
 * Extract snow depth from snow object or string
 * @param {Object|string|number} snow - Snow data
 * @returns {number} Snow depth value
 */
function getSnowDepth(snow) {
    if (!snow) return 0;
    if (typeof snow === 'object') return snow.mountain ?? snow.valley ?? 0;
    return snow; // string or number
}

/**
 * Extract numeric value from various types
 * @param {*} value - Value to extract number from
 * @returns {number} Numeric value
 */
function getNumericValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const match = value.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
}

/**
 * Get default sort direction for a given sort key
 * @param {string} sortKey - Sort key
 * @returns {string} 'asc' or 'desc'
 */
export function getDefaultSortDirection(sortKey) {
    // Distance and price should default to ascending (lower is better)
    // Score, pistes, snow should default to descending (higher is better)
    return ['distance', 'distance_km', 'traffic_duration', 'price'].includes(sortKey) ? 'asc' : 'desc';
}

/**
 * Update sort arrow indicators in table headers
 * @param {string} sortKey - Current sort key
 * @param {string} sortDirection - Current sort direction
 */
export function updateSortIndicators(sortKey, sortDirection) {
    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.innerHTML = th.innerHTML.replace('↑', '↕️').replace('↓', '↕️');
        if (th.dataset.sort === sortKey) {
            th.innerHTML = th.innerHTML.replace('↕️', sortDirection === 'asc' ? '↑' : '↓');
        }
    });
}
