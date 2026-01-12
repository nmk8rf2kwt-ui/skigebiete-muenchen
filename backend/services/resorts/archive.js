import { supabase } from '../db.js';

// --- DATABASE OPERATIONS ---

// Save daily snapshot
export async function saveSnapshot(resortId, data) {
    if (!supabase) return false;

    try {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Prepare data object, ensure it matches JSON structure we want
        const snapshotData = {
            liftsOpen: data.liftsOpen || null,
            liftsTotal: data.liftsTotal || null,
            snow: data.snow || null,
            weather: data.weather || null,
            historicalWeather: data.historicalWeather || null,
            lifts: data.lifts || null,
            slopes: data.slopes || null,
            price: data.price || null,
            priceDetail: data.priceDetail || null
        };

        const { error } = await supabase
            .from('resort_snapshots')
            .upsert({
                resort_id: resortId,
                date: date,
                data: snapshotData
            }, { onConflict: 'resort_id, date' });

        if (error) {
            console.error('Supabase error saving snapshot for resort:', resortId, error.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Error saving snapshot for ${resortId}:`, error);
        return false;
    }
}

// Save traffic log (Standard, from simple generic function)
export async function saveTrafficLog(resortId, standardTime, currentTime) {
    // This function signature is a bit weird for the new schema which expects city_id.
    // We'll assume this is "standard" Munich traffic if not specified? 
    // Or we map it to a default 'muenchen' entry?
    // Let's reuse saveMatrixTrafficLog which is more generic
    // assuming standardTime is duration and currentTime is actual? 
    // Wait, the previous implementation calculated delay = currentTime - standardTime.
    if (!supabase) return false;

    // Legacy support: assume Munich
    const delay = Math.max(0, currentTime - standardTime);
    return saveMatrixTrafficLog('muenchen', 'München', resortId, currentTime, delay);
}

// Save matrix traffic log
export async function saveMatrixTrafficLog(cityId, cityName, resortId, duration, delay) {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('traffic_logs')
            .insert({
                city_id: cityId,
                city_name: cityName,
                resort_id: resortId,
                duration: duration,
                delay: delay,
                timestamp: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase error saving traffic log for city:', cityId, 'resort:', resortId, error.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error saving matrix log for city:', cityId, 'resort:', resortId, error.message);
        return false;
    }
}

// Get history for last N days
export async function getHistory(resortId, days = 7) {
    if (!supabase) return [];

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('resort_snapshots')
            .select('*')
            .eq('resort_id', resortId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) {
            console.error('Supabase error getting history for resort:', resortId, error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error reading history for resort:', resortId, error);
        return [];
    }
}

// Calculate trends
// Note: This must now be async because getHistory is async
export async function getTrends(resortId) {
    const history = await getHistory(resortId, 7);

    if (history.length < 2) {
        return {
            resortId,
            snowTrend: 'unknown',
            snowChange: null,
            avgLiftsOpen: null,
            bestDays: []
        };
    }

    // Snow trend
    // Note: data is now in the `data` column directly as JSONB
    const snowValues = history
        .map(h => parseInt(h.data.snow))
        .filter(v => !isNaN(v));

    let snowTrend = 'stable';
    let snowChange = null;

    if (snowValues.length >= 2) {
        // history is typically ordered DESC (newest first) from getHistory
        // so snowValues[0] is newest, snowValues[len-1] is oldest
        const current = snowValues[0];
        const oldest = snowValues[snowValues.length - 1];
        const change = current - oldest;

        snowChange = `${change > 0 ? '+' : ''}${change}cm (${snowValues.length} days)`;

        if (change > 10) snowTrend = 'increasing';
        else if (change < -10) snowTrend = 'decreasing';
        else snowTrend = 'stable';
    }

    // Average lifts open
    const liftValues = history
        .map(h => h.data.liftsOpen)
        .filter(v => v !== null && v !== undefined);

    const avgLiftsOpen = liftValues.length > 0
        ? (liftValues.reduce((a, b) => a + b, 0) / liftValues.length).toFixed(1)
        : null;

    // Best days (most lifts open)
    const bestDays = history
        .slice() // copy
        .filter(h => h.data.liftsOpen !== null)
        .sort((a, b) => (b.data.liftsOpen || 0) - (a.data.liftsOpen || 0))
        .slice(0, 3)
        .map(h => h.date);

    return {
        resortId,
        snowTrend,
        snowChange,
        avgLiftsOpen: parseFloat(avgLiftsOpen),
        bestDays
    };
}

// Cleanup old data
// No op for DB, or could implement a DELETE query
export async function cleanup() {
    // Database can handle retention policies or we can add a delete query here.
    // For now, let's keep data.
    return 0;
}

// Get all resorts with history (Distinct query)
export async function getResortsWithHistory() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('resort_snapshots')
            .select('resort_id')
            .order('resort_id'); // Distinct isn't directly supported in simple select without raw SQL mostly, but let's see. 
        // Actually use .select('resort_id', { head: false, count: null }).range(0,1000) ???
        // Better to use rpc or raw query if distinct needed, OR simply fetch all unique IDs using JS if dataset small.
        // Or strictly: .select('resort_id').limit(1000) and unique in JS.

        if (error) throw error;

        const unique = [...new Set(data.map(item => item.resort_id))];
        return unique;
    } catch (error) {
        console.error('Error getting resorts with history:', error);
        return [];
    }
}

// Update historical weather for a specific date (used for backfill)
export async function updateHistoricalWeather(resortId, date, weatherData) {
    if (!supabase) return false;

    try {
        // Need to fetch existing first to merge? Or just upsert?
        // Upsert requires full row.
        const { data: existing } = await supabase
            .from('resort_snapshots')
            .select('data')
            .eq('resort_id', resortId)
            .eq('date', date)
            .single();

        let newData = existing ? existing.data : {};
        newData.historicalWeather = weatherData;

        const { error } = await supabase
            .from('resort_snapshots')
            .upsert({
                resort_id: resortId,
                date: date,
                data: newData
            }, { onConflict: 'resort_id, date' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating historical weather for resort:', resortId, 'date:', date, error.message);
        return false;
    }
}

// Get weather history for a resort
export async function getWeatherHistory(resortId, days = 30) {
    const history = await getHistory(resortId, days);

    // Extract weather data from snapshots
    return history.map(snapshot => {
        const weather = snapshot.data.historicalWeather;
        return {
            date: snapshot.date,
            tempMax: weather?.tempMax ?? null,
            tempMin: weather?.tempMin ?? null,
            precipitation: weather?.precipitation ?? null,
            snowfall: weather?.snowfall ?? null,
            snowDepth: weather?.snowDepth ?? null
        };
    }).filter(day => day.tempMax !== null || day.tempMin !== null);
}

// Get full traffic history for a city
export async function getCityTrafficHistory(cityId) {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('traffic_logs')
            .select('*')
            .eq('city_id', cityId)
            .order('timestamp', { ascending: true }); // Ascending for charts

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting city traffic history for city:', cityId, error);
        return [];
    }
}

// Get traffic history for a specific resort from a city
export async function getResortTrafficHistory(cityId, resortId) {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('traffic_logs')
            .select('*')
            .eq('city_id', cityId)
            .eq('resort_id', resortId)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting resort traffic history for resort:', resortId, error);
        return [];
    }
}
// Helper to check/set backfill status
// We'll store this in a special snapshot or just check for existing data?
// Simplest way: check if we have weather history for a sentinel resort or keep a state file?
// Problem: If filesystem is ephemeral, a state file 'backfill.completed' is lost.
// Solution: Store a "setting" in the DB. We can use the resort_snapshots table with a fake resort_id like 'SYSTEM_SETTINGS'.

const SETTINGS_RESORT_ID = 'SYSTEM_SETTINGS';
const BACKFILL_DATE = '2000-01-01'; // Constant date for settings

export async function isBackfillCompleted() {
    if (!supabase) return true; // If no DB, assume done to avoid loops

    const { data } = await supabase
        .from('resort_snapshots')
        .select('data')
        .eq('resort_id', SETTINGS_RESORT_ID)
        .eq('date', BACKFILL_DATE)
        .single();

    return !!(data && data.data && data.data.weatherBackfill === true);
}

export async function markBackfillCompleted() {
    if (!supabase) return;

    await supabase
        .from('resort_snapshots')
        .upsert({
            resort_id: SETTINGS_RESORT_ID,
            date: BACKFILL_DATE,
            data: { weatherBackfill: true }
        }, { onConflict: 'resort_id, date' });
}

// Sync resorts configuration to database
export async function syncResortsToDatabase(resorts) {
    if (!supabase) return;

    if (!resorts || resorts.length === 0) {
        console.warn("No resorts to sync.");
        return;
    }

    try {
        console.log(`🔄 Syncing ${resorts.length} resorts to DB...`);

        // Transform to match DB schema
        const rows = resorts.map(r => ({
            id: r.id,
            name: r.name,
            district: r.district || null,
            distance: r.distance || null,
            piste_km: r.piste_km || null,
            lifts: r.lifts || null,
            price: r.price || null,
            classification: r.classification || null,
            website: r.website || null,
            latitude: r.latitude || null,
            longitude: r.longitude || null,
            price_detail: r.priceDetail || null,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('resorts')
            .upsert(rows, { onConflict: 'id' });

        if (error) {
            console.error("Supabase error syncing resorts:", error.message);
        } else {
            console.log("✅ Resorts configuration synced to DB.");
        }
    } catch (error) {
        console.error("Error syncing resorts to DB:", error);
    }
}

// Sync cities usage to database
export async function syncCitiesToDatabase(cities) {
    if (!supabase) return;

    if (!cities || cities.length === 0) {
        console.warn("No cities to sync.");
        return;
    }

    try {
        console.log(`🔄 Syncing ${cities.length} cities to DB...`);

        const rows = cities.map(c => ({
            id: c.id,
            name: c.name,
            latitude: c.latitude,
            longitude: c.longitude,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('cities')
            .upsert(rows, { onConflict: 'id' });

        if (error) {
            console.error("Supabase error syncing cities:", error.message);
        } else {
            console.log("✅ Cities configuration synced to DB.");
        }
    } catch (error) {
        console.error("Error syncing cities to DB:", error);
    }
}
