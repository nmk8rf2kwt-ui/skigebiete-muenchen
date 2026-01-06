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

  // Snow Display - use forecast data if available
  let snowDisplay = "-";
  if (data.forecast && data.forecast.length > 0) {
    // Use today's snow depth from forecast
    const todaySnow = data.forecast[0].snowDepth || 0;
    snowDisplay = todaySnow > 0 ? `${todaySnow} cm` : "-";
  } else if (data.snow) {
    // Fallback to old format
    snowDisplay = data.snow;
  } else if (data.status === "error") {
    snowDisplay = "n.a.";
  }

  // Last Snowfall Display
  let lastSnowfallDisplay = "-";
  if (data.lastSnowfall) {
    const snowDate = new Date(data.lastSnowfall);
    const today = new Date();
    const diffDays = Math.floor((today - snowDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      lastSnowfallDisplay = "heute";
    } else if (diffDays === 1) {
      lastSnowfallDisplay = "gestern";
    } else if (diffDays <= 7) {
      lastSnowfallDisplay = `vor ${diffDays} Tagen`;
    } else {
      lastSnowfallDisplay = snowDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  }

  // Weather
  const weatherIcon = getWeatherIcon(data.weather);
  let weatherDisplay = "-";

  // Forecast (3 Days) - check data.forecast array
  if (data.forecast && Array.isArray(data.forecast) && data.forecast.length >= 3) {
    // Create three icons
    const icons = data.forecast.slice(0, 3).map(f => {
      const icon = f.weatherEmoji || getWeatherIcon(f.weather);
      // Tooltip: "Mon: 5°C"
      const date = new Date(f.date).toLocaleDateString('de-DE', { weekday: 'short' });
      return `<span title="${date}: ${f.tempMax}°C / ${f.tempMin}°C" style="cursor: help; margin-right: 4px;">${icon}</span>`;
    }).join("");
    weatherDisplay = icons;
  } else if (data.status === "error") {
    weatherDisplay = "n.a.";
  } else if (data.weather) {
    // Fallback to single icon
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

  // History button (Dedicated Column)
  const historyDisplay = (data.latitude && data.longitude)
    ? `<button class="history-btn" data-resort-id="${data.id}" data-resort-name="${data.name}" title="7-Tage Verlauf anzeigen">📊</button>`
    : '<span title="Keine Verlaufsdaten verfügbar">-</span>';

  // Score
  const score = data.score ?? "-";

  // Traffic light status indicator with tooltips
  let statusIndicator = '<span title="Status unbekannt">⚪</span>'; // Default/unknown
  if (data.status === "live") {
    statusIndicator = '<span title="Live-Daten verfügbar - Aktuelle Informationen vom Skigebiet">🟢</span>'; // Green - successful parse
  } else if (data.status === "static_only") {
    statusIndicator = '<span title="Nur Basisdaten - Live-Daten werden geladen">🟡</span>'; // Yellow - no parser or waiting
  } else if (data.status === "error") {
    statusIndicator = '<span title="Fehler beim Laden - Daten möglicherweise veraltet">🔴</span>'; // Red - parser failed
  }

  // Classification styling
  // Classification styling
  // User requested 4 graded values: Beginner/Family (Green), Intermediate (Yellow), Advanced (Red).
  // We'll map existing values to these.
  let typeLabel = data.classification || "Intermediate";
  let typeIcon = "🟡"; // Default intermediate
  let typeDesc = "Geeignet für Fortgeschrittene";

  // Normalization
  const cls = (data.classification || "").toLowerCase();

  if (cls.includes("beginner") || cls.includes("family") || cls.includes("einfach")) {
    typeLabel = "Family";
    typeIcon = "🟢"; // Green
    typeDesc = "Ideal für Anfänger und Familien - breite, flache Pisten.";
  } else if (cls.includes("intermediate") || cls.includes("allrounder") || cls.includes("scenic") || cls.includes("view")) {
    typeLabel = "Intermediate";
    typeIcon = "🟡"; // Yellow
    typeDesc = "Ausgewogener Mix aus blauen und roten Pisten.";
  } else if (cls.includes("advanced") || cls.includes("premium") || cls.includes("huge")) {
    typeLabel = "Advanced";
    typeIcon = "🔴"; // Red
    typeDesc = "Anspruchsvolles Gelände, viele Pistenkilometer.";
  } else if (cls.includes("glacier") || cls.includes("high") || cls.includes("world")) {
    typeLabel = "Pro";
    typeIcon = "⚫"; // Black
    typeDesc = "Für Profis: Gletscher, steile Abfahrten, hochalpin.";
  }

  // Use title attribute for mouseover
  const typeDisplay = `<span title="${typeDesc}" style="cursor: help;">${typeIcon} ${typeLabel}</span>`;

  // Weather button (Removed in favor of 3-day forecast)
  // But maybe kept for modal details if needed? The user confusingly asked to "place weather symbol from first column to weather column". 
  // Wait, there was a "weather button" (🌤️) next to the name?
  // Old code: `<td>${statusIndicator} ... ${weatherBtn} ${historyBtn}</td>`
  // I will REMOVE ${weatherBtn} and ${historyBtn} from Name column.

  // Webcam display
  const webcamDisplay = data.webcam
    ? `<a href="${data.webcam}" target="_blank" title="Webcam öffnen" style="text-decoration: none;">📷</a>`
    : '<span title="Keine Webcam verfügbar">-</span>';

  // Distance (in km) - separate from travel time
  const distanceKm = data.traffic?.distance || data.distanceKm || "-";
  const distanceDisplay = distanceKm !== "-" ? `${distanceKm} km` : "-";

  row.innerHTML = `
    <td style="text-align: center;">${statusIndicator}</td>
    <td><a href="${data.website}" target="_blank" style="text-decoration: none; color: inherit; font-weight: bold;">${data.name}</a></td>
    <td>${travel}</td>
    <td>${distanceDisplay}</td>
    <td>${data.piste_km ?? "-"} km</td>
    <td>${liftStatus}</td>
    <td>${price}</td>
    <td>${typeDisplay}</td>
    <td>${snowDisplay}</td>
    <td>${weatherDisplay}</td>
    <td>${webcamDisplay}</td>
    <td>${historyDisplay}</td>
    <td><strong>${score}</strong></td>
  `;
}
