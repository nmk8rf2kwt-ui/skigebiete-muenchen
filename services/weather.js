// services/weather.js
export async function getWeather3Days(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,weathercode` +
    `&forecast_days=3&timezone=auto`;
  const r = await fetch(url);
  return r.json();
}
