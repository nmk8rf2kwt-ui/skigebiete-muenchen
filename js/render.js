// Score calculation constants
const SCORE_WEIGHTS = {
  PISTE_KM: 2,
  DISTANCE: -0.5,
  PRICE: -0.5,
  OPEN_LIFTS: 3,
  DEFAULT_DISTANCE: 100,
  DEFAULT_PRICE: 50
};

// Helper to calculate a score for ranking
export function calculateScore(resort) {
  const piste = resort.piste_km || 0;
  const dist = resort.distance || SCORE_WEIGHTS.DEFAULT_DISTANCE;
  const price = resort.price || SCORE_WEIGHTS.DEFAULT_PRICE;
  const openLifts = resort.liftsOpen || 0;

  const score =
    (piste * SCORE_WEIGHTS.PISTE_KM) +
    (dist * SCORE_WEIGHTS.DISTANCE) +
    (price * SCORE_WEIGHTS.PRICE) +
    (openLifts * SCORE_WEIGHTS.OPEN_LIFTS);

  return Math.round(score);
}

// Helper for weather icons
// Helper for weather icons
function getWeatherIcon(weatherText) {
  if (!weatherText) return "☁️";
  const w = weatherText.toLowerCase();

  if (w.includes("sonne") || w.includes("klar") || w.includes("sun") || w.includes("clear")) return "☀️";
  if (w.includes("schnee") || w.includes("snow")) return "❄️";
  if (w.includes("regen") || w.includes("rain") || w.includes("drizzle")) return "🌧️";
  if (w.includes("bewölkt") || w.includes("wolken") || w.includes("cloud") || w.includes("overcast")) return "☁️";
  if (w.includes("nebel") || w.includes("fog") || w.includes("mist")) return "🌫️";
  if (w.includes("thunder") || w.includes("gewitter")) return "⛈️";

  return "🌤️";
}


export function renderTable(data, sortKey = 'score', filter = 'all', sortDirection = 'desc') {
  const tbody = document.querySelector("#skiTable tbody");
  tbody.innerHTML = "";

  // 1. Enrich data with Score if not present
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

    // Helper to extract number
    const getNum = (v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        // Remove non-numeric chars except dot/comma (for partial numbers if needed, but parseInt handles it)
        // Match first sequence of digits
        const match = v.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : 0;
      }
      return 0;
    };

    // Handle nulls/undefined first
    if (valA == null) valA = 0;
    if (valB == null) valB = 0;

    const multiplier = sortDirection === "asc" ? 1 : -1;

    // Start with special keys that REQUIRE numeric parsing from potential strings
    // (Snow is often "> 10 cm", Distance might be string in some contexts though usually number)
    if (['snow', 'distance', 'piste_km', 'price', 'score'].includes(sortKey)) {
      return (getNum(valA) - getNum(valB)) * multiplier;
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

  // 4. Render
  enrichedData.forEach((resort, index) => {
    const tr = document.createElement("tr");
    renderRow(tr, { ...resort, rank: index + 1 });
    tbody.appendChild(tr);
  });

  // Visual: Update Arrows
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.innerHTML = th.innerHTML.replace('↑', '↕️').replace('↓', '↕️');
    if (th.dataset.sort === sortKey) {
      th.innerHTML = th.innerHTML.replace('↕️', sortDirection === 'asc' ? '↑' : '↓');
    }
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
  const travelTime = data.distance ? `${data.distance} min` : "-";
  let travelDisplay = travelTime;

  if (travelTime !== "-" && (data.latitude && data.longitude)) {
    // Prefer address if available for cleaner navigation, otherwise validation coordinates
    const destQuery = data.address ? encodeURIComponent(data.address) : `${data.latitude},${data.longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
    const tooltip = data.address ? `Ziel: ${data.address}` : "Navigation starten";

    travelDisplay = `<a href="${mapsUrl}" target="_blank" title="${tooltip}" style="text-decoration: underline; text-decoration-style: dotted; color: inherit;">${travelTime}</a>`;
  }

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
      // Ensure we have a symbol. If backend sends text (e.g. "Overcast" or "Fog"), derive icon from it.
      // Emojis are usually non-Latin characters. Use regex to check for letters.
      let icon = f.weatherEmoji;

      // If icon is missing OR contains Latin letters (meaning it's a text description like "Rain", "Fog"), derive it.
      if (!icon || /[a-zA-Z]/.test(icon)) {
        icon = getWeatherIcon(f.weather || f.weatherDesc || icon || "");
      }

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
    <td>${travelDisplay}</td>
    <td>${distanceDisplay}</td>
    <td>${data.piste_km ?? "-"} km</td>
    <td>${liftStatus}</td>
    <td>${price}</td>
    <td>${typeDisplay}</td>
    <td>${snowDisplay}</td>
    <td>${lastSnowfallDisplay}</td>
    <td>${weatherDisplay}</td>
    <td>${webcamDisplay}</td>
    <td>${historyDisplay}</td>
    <td><strong>${score}</strong></td>
  `;
}
