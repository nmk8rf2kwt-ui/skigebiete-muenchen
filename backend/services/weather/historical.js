// Imports removed (fs, path, url) as they are no longer needed

/**
 * Fetch historical weather data from Open-Meteo Archive API
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of daily weather data
 */
export async function fetchHistoricalWeather(latitude, longitude, startDate, endDate) {
    // Validate inputs
    if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
    }

    if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
    }

    // Build API URL
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,snow_depth_mean',
        timezone: 'Europe/Berlin'
    });

    const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;

    try {
        console.log(`Fetching historical weather for ${latitude},${longitude} from ${startDate} to ${endDate}`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Transform API response to our format
        if (!data.daily || !data.daily.time) {
            console.warn('No daily data in API response');
            return [];
        }

        const weatherData = data.daily.time.map((date, index) => ({
            date,
            tempMax: data.daily.temperature_2m_max?.[index] ?? null,
            tempMin: data.daily.temperature_2m_min?.[index] ?? null,
            precipitation: data.daily.precipitation_sum?.[index] ?? null,
            snowfall: data.daily.snowfall_sum?.[index] ?? null,
            snowDepth: data.daily.snow_depth_mean?.[index] ?? null
        }));

        console.log(`✓ Fetched ${weatherData.length} days of historical weather data`);
        return weatherData;

    } catch (error) {
        console.error(`Error fetching historical weather:`, error.message);
        throw error;
    }
}

/**
 * Backfill historical weather data for a specific resort
 * @param {Object} resort - Resort object with id, latitude, longitude
 * @param {number} days - Number of days to backfill (default: 30)
 * @returns {Promise<Object>} Object mapping dates to weather data
 */
export async function backfillWeatherHistory(resort, days = 30) {
    if (!resort || !resort.id || !resort.latitude || !resort.longitude) {
        throw new Error('Invalid resort object');
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📥 Backfilling ${days} days of weather history for ${resort.id}...`);

    try {
        const weatherData = await fetchHistoricalWeather(
            resort.latitude,
            resort.longitude,
            startDateStr,
            endDateStr
        );

        // Convert array to object keyed by date for easier lookup
        const weatherByDate = {};
        weatherData.forEach(day => {
            weatherByDate[day.date] = day;
        });

        console.log(`✅ Backfilled ${Object.keys(weatherByDate).length} days for ${resort.id}`);
        return weatherByDate;

    } catch (error) {
        console.error(`❌ Failed to backfill weather for ${resort.id}:`, error.message);
        return {};
    }
}

/**
 * Get yesterday's weather data for a resort
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object|null>} Yesterday's weather data or null
 */
export async function getYesterdayWeather(latitude, longitude) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
        const data = await fetchHistoricalWeather(latitude, longitude, dateStr, dateStr);
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error fetching yesterday weather:', error.message);
        return null;
    }
}

// Backfill status functions moved to history.js
