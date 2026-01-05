// Weather service using Open-Meteo API (free, no key required)
export async function getWeatherForecast(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Berlin&forecast_days=3`;

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

            return {
                date,
                tempMax: Math.round(data.daily.temperature_2m_max[index]),
                tempMin: Math.round(data.daily.temperature_2m_min[index]),
                weatherCode: code,
                weatherDesc: weather.desc,
                weatherEmoji: weather.emoji
            };
        });

        return forecast;
    } catch (error) {
        console.error("Weather fetch error:", error);
        return null;
    }
}
