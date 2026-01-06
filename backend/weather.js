// Weather service using Open-Meteo API (free, no key required)
export async function getWeatherForecast(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,snowfall_sum&hourly=snow_depth&timezone=Europe/Berlin&forecast_days=3`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather");

        const data = await res.json();

        // Map weather codes to simple descriptions and emojis
        const weatherCodeMap = {
            0: { desc: "Clear", emoji: "☀️" },
            1: { desc: "Mainly Clear", emoji: "🌤️" },
            2: { desc: "Partly Cloudy", emoji: "⛅" },
            3: { desc: "Overcast", emoji: "☁️" },
            45: { desc: "Foggy", emoji: "🌫️" },
            48: { desc: "Foggy", emoji: "🌫️" },
            51: { desc: "Light Drizzle", emoji: "🌦️" },
            53: { desc: "Drizzle", emoji: "🌦️" },
            55: { desc: "Heavy Drizzle", emoji: "🌧️" },
            61: { desc: "Light Rain", emoji: "🌧️" },
            63: { desc: "Rain", emoji: "🌧️" },
            65: { desc: "Heavy Rain", emoji: "🌧️" },
            71: { desc: "Light Snow", emoji: "🌨️" },
            73: { desc: "Snow", emoji: "❄️" },
            75: { desc: "Heavy Snow", emoji: "❄️" },
            77: { desc: "Snow Grains", emoji: "❄️" },
            80: { desc: "Light Showers", emoji: "🌦️" },
            81: { desc: "Showers", emoji: "🌧️" },
            82: { desc: "Heavy Showers", emoji: "🌧️" },
            85: { desc: "Light Snow Showers", emoji: "🌨️" },
            86: { desc: "Snow Showers", emoji: "❄️" },
            95: { desc: "Thunderstorm", emoji: "⛈️" },
            96: { desc: "Thunderstorm + Hail", emoji: "⛈️" },
            99: { desc: "Thunderstorm + Hail", emoji: "⛈️" }
        };

        const forecast = data.daily.time.map((date, index) => {
            const code = data.daily.weathercode[index];
            const weather = weatherCodeMap[code] || { desc: "Unknown", emoji: "🌤️" };

            // Approximate snow depth for the day (using noon value from hourly if available, or 0)
            // Open-Meteo hourly returns 24 values per day. We take index * 24 + 12 (noon)
            const hourlyIndex = index * 24 + 12;
            let snowDepth = 0;
            if (data.hourly && data.hourly.snow_depth && data.hourly.snow_depth[hourlyIndex]) {
                snowDepth = data.hourly.snow_depth[hourlyIndex]; // in meters
            }
            // For the first day, try to get current hour
            if (index === 0 && data.hourly && data.hourly.snow_depth) {
                const currentHour = new Date().getHours();
                if (data.hourly.snow_depth[currentHour]) {
                    snowDepth = data.hourly.snow_depth[currentHour];
                }
            }

            // Format snow depth to cm
            const snowDepthCm = Math.round(snowDepth * 100);

            return {
                date,
                tempMax: Math.round(data.daily.temperature_2m_max[index]),
                tempMin: Math.round(data.daily.temperature_2m_min[index]),
                weatherCode: code,
                weatherDesc: weather.desc,
                weatherEmoji: weather.emoji,
                snowDepth: snowDepthCm // cm
            };
        });

        return forecast;
    } catch (error) {
        console.error("Weather fetch error:", error);
        return null;
    }
}

// Helper to get simple current status from a forecast
export function getCurrentConditions(forecast) {
    if (!forecast || forecast.length === 0) return null;
    const today = forecast[0];
    return {
        weather: today.weatherDesc,
        emoji: today.weatherEmoji,
        snow: today.snowDepth > 0 ? `${today.snowDepth} cm` : "0 cm",
        temp: `${today.tempMax}°C`
    };
}
