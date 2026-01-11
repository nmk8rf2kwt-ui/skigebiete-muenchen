/**
 * SmartScore v1 - Deterministic Resort Ranking
 * 
 * Components (weighted):
 * - Availability (lifts open): 0.35
 * - Travel (ETA): 0.25
 * - Snow (depth): 0.20
 * - Comfort (weather): 0.15
 * - Price: 0.05
 */

// ============ CONFIGURATION ============

const WEIGHTS = {
    availability: 0.35,
    travel: 0.25,
    snow: 0.20,
    comfort: 0.15,
    price: 0.05
};

const FRESHNESS_MULTIPLIERS = {
    FRESH: 1.00,
    DEGRADED: 0.80,
    STALE: 0.50,
    EXPIRED: 0.00
};

// Thresholds in milliseconds
const FRESHNESS_THRESHOLDS = {
    lifts: {
        fresh: 4.5 * 60 * 60 * 1000,    // 4.5 hours (Match 4h schedule + buffer)
        degraded: 8 * 60 * 60 * 1000,   // 8 hours
        stale: 24 * 60 * 60 * 1000      // 24 hours
    },
    weather: {
        fresh: 4.5 * 60 * 60 * 1000,    // 4.5 hours
        degraded: 6 * 60 * 60 * 1000,   // 6 hours
        stale: 12 * 60 * 60 * 1000      // 12 hours
    },
    traffic: {
        fresh: 60 * 60 * 1000,          // 1 hour
        degraded: 2.5 * 60 * 60 * 1000, // 2.5 hours
        stale: 4 * 60 * 60 * 1000       // 4 hours
    },
    snow: {
        fresh: 60 * 60 * 1000,       // 1 hour (same as weather)
        degraded: 3 * 60 * 60 * 1000,
        stale: 6 * 60 * 60 * 1000
    },
    price: {
        fresh: 24 * 60 * 60 * 1000,    // 24 hours
        degraded: 48 * 60 * 60 * 1000,  // 48 hours
        stale: 168 * 60 * 60 * 1000     // 7 days
    }
};

// Season phase dates (MM-DD format)
const SEASON_PHASES = {
    PRE: { start: '12-01', end: '12-19' },
    MAIN: { start: '12-20', end: '03-15' },
    LATE: { start: '03-16', end: '04-30' }
};

// Price normalization params
const PRICE_MIN = 35;
const PRICE_MAX = 85;

// ============ CORE FUNCTIONS ============

/**
 * Determine current season phase based on date
 */
export function getSeasonPhase(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // PRE: Dec 1-19
    if (month === 12 && day >= 1 && day <= 19) return 'PRE';

    // MAIN: Dec 20 - Mar 15
    if ((month === 12 && day >= 20) || (month >= 1 && month <= 2) || (month === 3 && day <= 15)) return 'MAIN';

    // LATE: Mar 16 - Apr 30
    if ((month === 3 && day >= 16) || month === 4) return 'LATE';

    // Off-season (fallback to MAIN scoring)
    return 'MAIN';
}

/**
 * Get freshness state based on timestamp age
 */
export function getFreshnessState(timestamp, category) {
    if (!timestamp) return 'EXPIRED';

    const thresholds = FRESHNESS_THRESHOLDS[category];
    if (!thresholds) return 'FRESH'; // Unknown category defaults to fresh

    const ageMs = Date.now() - new Date(timestamp).getTime();

    if (ageMs <= thresholds.fresh) return 'FRESH';
    if (ageMs <= thresholds.degraded) return 'DEGRADED';
    if (ageMs <= thresholds.stale) return 'STALE';
    return 'EXPIRED';
}

/**
 * Calculate Availability raw score (0-1)
 * Based on open_lifts / lifts_total_reference
 */
export function calculateAvailabilityRaw(openLifts, totalLifts) {
    if (totalLifts === null || totalLifts === undefined || totalLifts === 0) {
        return null; // No data
    }

    const openPct = (openLifts || 0) / totalLifts;

    // Piecewise scoring:
    // < 0.10 → 0.00 (RED)
    // 0.10-0.40 → 0.30-0.70 (ORANGE)
    // >= 0.40 → 0.70-1.00 (GREEN)

    if (openPct < 0.10) {
        return 0.00;
    } else if (openPct < 0.40) {
        return 0.30 + ((openPct - 0.10) / 0.30) * 0.40;
    } else {
        return 0.70 + Math.min(1.0, (openPct - 0.40) / 0.60) * 0.30;
    }
}

/**
 * Get availability traffic light status
 */
export function getAvailabilityStatus(openPct) {
    if (openPct < 0.10) return 'RED';
    if (openPct < 0.40) return 'ORANGE';
    return 'GREEN';
}

/**
 * Calculate Travel/ETA raw score (0-1)
 */
export function calculateTravelRaw(etaMinutes) {
    if (etaMinutes === null || etaMinutes === undefined) {
        return null; // No data
    }

    // Piecewise:
    // <= 45 min → 1.00
    // 45-75 min → 1.00 → 0.60
    // 75-120 min → 0.60 → 0.20
    // > 120 min → 0.00

    if (etaMinutes <= 45) {
        return 1.00;
    } else if (etaMinutes <= 75) {
        return 1.00 - ((etaMinutes - 45) / 30) * 0.40;
    } else if (etaMinutes <= 120) {
        return 0.60 - ((etaMinutes - 75) / 45) * 0.40;
    } else {
        return 0.00;
    }
}

/**
 * Calculate Snow raw score (0-1) - season aware
 */
export function calculateSnowRaw(snowDepthCm, seasonPhase = 'MAIN') {
    if (snowDepthCm === null || snowDepthCm === undefined) {
        return null; // No data
    }

    // Thresholds per season
    const thresholds = {
        PRE: { min: 20, mid: 60, max: 60, lowScore: 0.30, midScore: 0.80 },
        MAIN: { min: 40, mid: 100, max: 100, lowScore: 0.30, midScore: 0.90 },
        LATE: { min: 30, mid: 80, max: 80, lowScore: 0.30, midScore: 0.80 }
    };

    const t = thresholds[seasonPhase] || thresholds.MAIN;

    if (snowDepthCm < t.min) {
        return 0.00;
    } else if (snowDepthCm < t.mid) {
        // Linear interpolation from lowScore to midScore
        return t.lowScore + ((snowDepthCm - t.min) / (t.mid - t.min)) * (t.midScore - t.lowScore);
    } else {
        return 1.00;
    }
}

/**
 * Calculate Comfort/Weather raw score (0-1)
 * Multiplicative: temp_score * precip_score * wind_score
 */
export function calculateComfortRaw(tempC, precipMm, windKmh) {
    // Temperature score
    let tempScore = 1.0;
    if (tempC !== null && tempC !== undefined) {
        if (tempC <= -15) {
            tempScore = 0.20;
        } else if (tempC <= -5) {
            // Linear -15 to -5 → 0.60 to 1.00
            tempScore = 0.60 + ((tempC + 15) / 10) * 0.40;
        } else if (tempC <= 2) {
            tempScore = 1.00;
        } else if (tempC <= 8) {
            // Linear 2 to 8 → 1.00 to 0.60
            tempScore = 1.00 - ((tempC - 2) / 6) * 0.40;
        } else {
            tempScore = 0.40;
        }
    }

    // Precipitation score (3h sum in mm)
    let precipScore = 1.0;
    if (precipMm !== null && precipMm !== undefined) {
        if (precipMm <= 0.5) {
            precipScore = 1.00;
        } else if (precipMm <= 3) {
            // Linear 0.5 to 3 → 1.00 to 0.60
            precipScore = 1.00 - ((precipMm - 0.5) / 2.5) * 0.40;
        } else {
            precipScore = 0.30;
        }
    }

    // Wind score (km/h)
    let windScore = 1.0;
    if (windKmh !== null && windKmh !== undefined) {
        if (windKmh <= 20) {
            windScore = 1.00;
        } else if (windKmh <= 50) {
            // Linear 20 to 50 → 1.00 to 0.60
            windScore = 1.00 - ((windKmh - 20) / 30) * 0.40;
        } else {
            windScore = 0.30;
        }
    }

    return tempScore * precipScore * windScore;
}

/**
 * Calculate Price raw score (0-1)
 * Lower price = higher score
 */
export function calculatePriceRaw(priceEur) {
    if (priceEur === null || priceEur === undefined) {
        return null; // No data
    }

    // Clamp to [35, 85] range
    const clampedPrice = Math.max(PRICE_MIN, Math.min(PRICE_MAX, priceEur));

    // Invert: lower price = higher score
    return 1 - ((clampedPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN));
}

// ============ MAIN CALCULATION ============

/**
 * Calculate complete SmartScore for a resort
 * 
 * @param {Object} params
 * @param {number} params.liftsOpen - Number of open lifts
 * @param {number} params.liftsTotal - Total number of lifts
 * @param {number} params.etaMinutes - Travel time in minutes
 * @param {number} params.snowDepthCm - Snow depth in cm
 * @param {number} params.tempC - Temperature in Celsius
 * @param {number} params.precipMm - Precipitation next 3h in mm
 * @param {number} params.windKmh - Wind speed in km/h
 * @param {number} params.priceEur - Day ticket price in EUR
 * @param {Object} params.timestamps - Timestamps for freshness calculation
 * 
 * @returns {Object} SmartScore result with total, components, and freshness states
 */
export function calculateSmartScore({
    liftsOpen,
    liftsTotal,
    etaMinutes,
    snowDepthCm,
    tempC,
    precipMm,
    windKmh,
    priceEur,
    timestamps = {}
}) {
    const seasonPhase = getSeasonPhase();

    // Calculate freshness states
    const freshness = {
        lifts: getFreshnessState(timestamps.lifts, 'lifts'),
        weather: getFreshnessState(timestamps.weather, 'weather'),
        traffic: getFreshnessState(timestamps.traffic, 'traffic'),
        snow: getFreshnessState(timestamps.snow, 'snow'),
        price: getFreshnessState(timestamps.price, 'price')
    };

    // Calculate raw scores (0-1)
    const rawScores = {
        availability: calculateAvailabilityRaw(liftsOpen, liftsTotal),
        travel: calculateTravelRaw(etaMinutes),
        snow: calculateSnowRaw(snowDepthCm, seasonPhase),
        comfort: calculateComfortRaw(tempC, precipMm, windKmh),
        price: calculatePriceRaw(priceEur)
    };

    // Apply freshness multipliers
    const components = {};
    let totalScore = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
        const raw = rawScores[key];

        // Determine which freshness category applies
        let freshnessKey = key;
        if (key === 'availability') freshnessKey = 'lifts';
        if (key === 'travel') freshnessKey = 'traffic';
        if (key === 'comfort') freshnessKey = 'weather';

        const freshnessState = freshness[freshnessKey] || 'FRESH';
        const freshMultiplier = FRESHNESS_MULTIPLIERS[freshnessState];

        // Handle missing data
        if (raw === null) {
            components[key] = {
                raw: null,
                freshness: 'EXPIRED',
                freshMultiplier: 0,
                weighted: 0,
                missing: true
            };
        } else {
            const weighted = raw * freshMultiplier * weight;
            components[key] = {
                raw: Math.round(raw * 1000) / 1000,  // 3 decimals
                freshness: freshnessState,
                freshMultiplier,
                weighted: Math.round(weighted * 1000) / 1000,
                missing: false
            };
            totalScore += weighted;
        }
    }

    // Scale to 0-100
    const smartScoreTotal = Math.round(totalScore * 100);

    // Calculate open percentage for tie-breaker
    const openPct = liftsTotal ? (liftsOpen || 0) / liftsTotal : 0;

    return {
        total: smartScoreTotal,
        components,
        freshness,
        seasonPhase,
        // Tie-breaker data
        tieBreaker: {
            openPct: Math.round(openPct * 100) / 100,
            etaMinutes: etaMinutes || 999,
            liftsOpen: liftsOpen || 0
        }
    };
}

/**
 * Compare function for sorting resorts by SmartScore
 * Handles tie-breakers: score → openPct → eta → pistes_km
 */
export function compareBySmartScore(a, b) {
    // 1. SmartScore descending
    if (b.smartScore !== a.smartScore) {
        return (b.smartScore || 0) - (a.smartScore || 0);
    }

    // 2. Open percentage descending
    const aOpenPct = a.smartScoreResult?.tieBreaker?.openPct || 0;
    const bOpenPct = b.smartScoreResult?.tieBreaker?.openPct || 0;
    if (bOpenPct !== aOpenPct) {
        return bOpenPct - aOpenPct;
    }

    // 3. ETA ascending
    const aEta = a.smartScoreResult?.tieBreaker?.etaMinutes || 999;
    const bEta = b.smartScoreResult?.tieBreaker?.etaMinutes || 999;
    if (aEta !== bEta) {
        return aEta - bEta;
    }

    // 4. Piste km descending
    return (b.piste_km || 0) - (a.piste_km || 0);
}

export default {
    calculateSmartScore,
    compareBySmartScore,
    getSeasonPhase,
    getFreshnessState,
    calculateAvailabilityRaw,
    calculateTravelRaw,
    calculateSnowRaw,
    calculateComfortRaw,
    calculatePriceRaw,
    getAvailabilityStatus,
    WEIGHTS,
    FRESHNESS_THRESHOLDS,
    SEASON_PHASES
};
