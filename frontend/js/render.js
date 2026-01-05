// Helper to calculate a score for ranking
// Helper to calculate a score for ranking
export function calculateScore(resort) {
  // Simple algorithm:
  // + Piste KM
  // - Distance (penalize far resorts)
  // - Price (penalize expensive)
  // + Open Lifts (bonus for availability)

  const piste = resort.piste_km || 0;
  const dist = resort.distance || 100; // default large if missing
  const price = resort.price || 50;
  const openLifts = resort.liftsOpen || 0;

  // Weights
  const score = (piste * 2) - (dist * 0.5) - (price * 0.5) + (openLifts * 3);
  return Math.round(score);
}

// Helper for weather icons
function getWeatherIcon(weatherText) {
  if (!weatherText) return "☁️";
  const w = weatherText.toLowerCase();
  if (w.includes("sonne") || w.includes("klar")) return "☀️";
  if (w.includes("schnee")) return "❄️";
  if (w.includes("regen")) return "🌧️";
  if (w.includes("bewölkt") || w.includes("wolken")) return "☁️";
  if (w.includes("nebel")) return "🌫️";
  return "🌤️";
}


export function renderTable(data, sortKey = 'score', filter = 'all') {
  const tbody = document.querySelector("#skiTable tbody");
  tbody.innerHTML = "";

  // 1. Enlighten data with Score if not present
  let enrichedData = data.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : calculateScore(r)
  }));

  // 2. Filter
  if (filter === 'top3') {
    // Sort by score first to find top 3
    enrichedData.sort((a, b) => b.score - a.score);
    enrichedData = enrichedData.slice(0, 3);
  } else if (filter === 'open') {
    enrichedData = enrichedData.filter(r => r.liftsOpen > 0);
  }

  // 3. Sort
  enrichedData.sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    // Handle nulls/undefined
    if (valA == null) valA = 0; // treat missing as 0 or infinity depending on context? 
    if (valB == null) valB = 0;

    // Numerical sort
    if (typeof valA === 'number' && typeof valB === 'number') {
      // Ascending for distance/price? Descending for score/pistes?
      // Heuristic:
      if (['distance', 'price'].includes(sortKey)) {
        return valA - valB; // Low is good
      }
      return valB - valA; // High is good (score, snow, pistes)
    }

    // String sort (e.g. name)
    if (typeof valA === 'string') {
      return valA.localeCompare(valB);
    }
    return 0;
  });

  // 4. Render
  enrichedData.forEach((resort, index) => {
    const tr = document.createElement("tr");
    renderRow(tr, { ...resort, rank: index + 1 });
    tbody.appendChild(tr);
  });
}

export function renderRow(row, data) {
  const isError = data.status === "error"; // || data.status === "unavailable";
  // Determine if data is missing or just zero
  const hasLive = data.status === "live";

  // Format price
  const price = data.price ? `€${data.price.toFixed(2)}` : "-";

  // Format lifts
  let liftStatus = "-";
  // liftsTotal comes from live parser, lifts comes from static JSON
  const totalLifts = data.liftsTotal || data.lifts;

  if (data.status === "error") {
    liftStatus = "n.a. ⚠️";
  } else if (totalLifts) {
    if (data.status === "static_only" || data.status === undefined) {
      liftStatus = `⏳ / ${totalLifts}`;
    } else {
      const open = data.liftsOpen ?? "?";
      liftStatus = `${open} / ${totalLifts}`;
    }
  }

  // Format travel time
  const travel = data.distance ? `${data.distance} min` : "-";

  // Weather
  const weatherIcon = getWeatherIcon(data.weather);
  let weatherDisplay = "-";

  if (data.status === "error") {
    weatherDisplay = "n.a.";
  } else if (data.weather) {
    weatherDisplay = `${weatherIcon} ${data.weather}`;
  } else if (data.status === "static_only") {
    weatherDisplay = "⏳";
  }

  // Snow
  let snowDisplay = "-";
  let trendIndicator = "";

  if (data.status === "error") {
    snowDisplay = "n.a.";
  } else if (data.snow) {
    // Parse snow value to check for >20cm fresh snow
    const snowValue = parseInt(data.snow);
    const freshSnowIndicator = (snowValue > 20) ? " ⭐" : "";

    // Add trend indicator if available
    if (data.snowTrend) {
      if (data.snowTrend === 'increasing') trendIndicator = " ↗️";
      else if (data.snowTrend === 'decreasing') trendIndicator = " ↘️";
      else trendIndicator = " →";
    }

    snowDisplay = `${data.snow}${freshSnowIndicator}${trendIndicator}`;
  } else if (data.status === "static_only") {
    snowDisplay = "⏳";
  }

  // History button (if coordinates available, we assume history exists)
  const historyBtn = (data.latitude && data.longitude)
    ? `<button class="history-btn" data-resort-id="${data.id}" data-resort-name="${data.name}" title="View 7-day history">📊</button>`
    : '';

  // Score
  const score = data.score ?? "-";

  // Traffic light status indicator
  let statusIndicator = "⚪"; // Default/unknown
  if (data.status === "live") {
    statusIndicator = "🟢"; // Green - successful parse
  } else if (data.status === "static_only") {
    statusIndicator = "🟡"; // Yellow - no parser or waiting
  } else if (data.status === "error") {
    statusIndicator = "🔴"; // Red - parser failed
  }

  // Classification styling
  const typeMap = {
    "Beginner": "🟢",
    "Intermediate": "🔵",
    "Advanced": "⚫️",
    "Allrounder": "🔷"
  };
  const typeDisplay = data.classification ? `${typeMap[data.classification] || ''} ${data.classification}` : "-";

  // Weather button (only if coordinates available)
  const weatherBtn = (data.latitude && data.longitude)
    ? `<button class="weather-btn" data-resort-id="${data.id}" data-resort-name="${data.name}" title="3-day forecast">🌤️</button>`
    : '';

  // Webcam display
  const webcamDisplay = data.webcam
    ? `<a href="${data.webcam}" target="_blank" class="webcam-link" title="View webcam">📷</a>`
    : "-";

  row.innerHTML = `
    <td>${data.rank}</td>
    <td>${statusIndicator} <a href="${data.website}" target="_blank" style="text-decoration: none; color: inherit; font-weight: bold;">${data.name}</a> ${weatherBtn} ${historyBtn}</td>
    <td>${travel}</td>
    <td>${data.piste_km ?? "-"} km</td>
    <td>${liftStatus}</td>
    <td>${price}</td>
    <td>${typeDisplay}</td>
    <td>${snowDisplay}</td>
    <td>${weatherDisplay}</td>
    <td>${webcamDisplay}</td>
    <td><strong>${score}</strong></td>
  `;
}
