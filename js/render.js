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
  let price = data.price ? `€${data.price.toFixed(2)}` : "-";
  if (data.priceDetail) {
    const pd = data.priceDetail;
    const info = `
Erwachsene: ${pd.currency}${pd.adult.toFixed(2)}
Jugend: ${pd.currency}${pd.youth.toFixed(2)}
Kinder: ${pd.currency}${pd.child.toFixed(2)}
${pd.info || ""}
`.trim();
    price += ` <span title="${info}" style="cursor: help; margin-left: 2px;">ℹ️</span>`;
  }

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

  // Format travel time (Standard & Traffic)
  const standardTime = data.distance || 0;
  let standardDisplay = "-";

  // 1. Standard Time with Link
  if (standardTime) {
    const timeText = `${standardTime} min`;
    if (data.latitude && data.longitude) {
      const destQuery = data.address ? encodeURIComponent(data.address) : `${data.latitude},${data.longitude}`;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
      standardDisplay = `<a href="${mapsUrl}" target="_blank" title="Route planen (Google Maps)" style="text-decoration: underline; text-decoration-style: dotted; color: inherit;">${timeText}</a>`;
    } else {
      standardDisplay = timeText;
    }
  }

  // 2. Traffic Time with Color
  let trafficDisplay = '<span style="color: #bdc3c7; font-size: 0.9em;">-</span>'; // Default gray

  // data.traffic comes from resortManager injection
  if (data.traffic && data.traffic.duration) {
    const liveTime = data.traffic.duration;
    const delay = Math.max(0, liveTime - standardTime);
    let style = "";

    if (delay > 20) {
      style = "color: #e74c3c; font-weight: bold;"; // Red (Heavy Traffic)
    } else if (delay > 10) {
      style = "color: #f39c12; font-weight: bold;"; // Orange/Yellow (Moderate)
    } else if (delay > 0) {
      style = "color: #f1c40f;"; // Yellow (Slight)
    } else {
      style = "color: #2ecc71;"; // Green (Good/Faster)
    }

    const delayText = delay > 0 ? ` (+${delay})` : '';
    trafficDisplay = `<span style="${style}" title="Aktuell: ${liveTime} min${delayText}">${liveTime} min</span>`;
  } else if (data.status === "live") {
    // If live but no traffic data (API error or key missing), show Standard? Or "n.a."
    trafficDisplay = `<span title="Keine Verkehrsdaten" style="color: #bdc3c7;">n.a.</span>`;
  }

  // Snow Display - use forecast data if available
  let snowDisplay = "-";
  // Check for new object structure first
  if (data.snow && typeof data.snow === 'object') {
    const s = data.snow;
    const mountain = s.mountain !== null ? `${s.mountain} cm` : "-";
    const valley = s.valley !== null ? `${s.valley} cm` : "-";

    // Combined display: "Mountain / Valley" or just one if the other is missing?
    // User asked for "schneehöhen für tal und berg".
    // Let's ensure icons or labels: "🏔️ 50 / 🏠 20"

    let text = "";
    if (s.mountain !== null && s.valley !== null) {
      text = `🏔️${s.mountain} / 🏠${s.valley} cm`;
    } else if (s.mountain !== null) {
      text = `🏔️${s.mountain} cm`;
    } else if (s.valley !== null) {
      text = `🏠${s.valley} cm`;
    } else {
      text = "-";
    }

    // Source Indication
    const sourceColor = s.source === 'api' ? '#f1c40f' : '#2ecc71'; // Yellow vs Green
    const sourceTitle = s.source === 'api'
      ? 'Daten von Wetter-API (geschätzt/Fallback)'
      : 'Offizielle Daten vom Skigebiet';

    const timestamp = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
    const tooltip = `${sourceTitle}${timestamp ? ` (Stand: ${timestamp})` : ''}${s.state ? `\nZustand: ${s.state}` : ''}`;

    snowDisplay = `<span title="${tooltip}" style="border-bottom: 2px solid ${sourceColor}; cursor: help;">${text}</span>`;

  } else if (data.snow) {
    // Fallback to old format (string)
    snowDisplay = data.snow;
  } else if (data.status === "error") {
    snowDisplay = "n.a.";
  }

  // Last Snowfall Display - check nested structure
  let lastSnowfallDisplay = "-";
  // Priority: data.snow.lastSnowfall (Resort) -> data.forecast.lastSnowfall (API) -> data.lastSnowfall (Legacy)
  const lastSnowfallDate = data.snow?.lastSnowfall || data.forecast?.lastSnowfall || data.lastSnowfall;

  if (lastSnowfallDate) {
    const snowDate = new Date(lastSnowfallDate);
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
  // Backend sends forecast as: { forecast: [...], lastSnowfall: "..." }
  const forecastArray = data.forecast?.forecast || data.forecast;

  if (forecastArray && Array.isArray(forecastArray) && forecastArray.length >= 3) {
    // Create three icons
    const icons = forecastArray.slice(0, 3).map(f => {
      // Ensure we have a symbol. If backend sends text (e.g. "Overcast" or "Fog"), derive icon from it.
      // Emojis are usually non-Latin characters. Use regex to check for letters.
      let icon = f.weatherEmoji;
      let desc = f.weatherDesc || f.weather || "";

      // If icon is missing OR contains Latin letters, derive it.
      if (!icon || /[a-zA-Z]/.test(icon)) {
        icon = getWeatherIcon(f.weather || f.weatherDesc || icon || "");
      }

      // If we derived the icon from text, use that text as description if none exists
      if (!desc && /[a-zA-Z]/.test(f.weather)) desc = f.weather;

      // Tooltip: "Mo, 06.01.: Leicht bewölkt, 5°C / -2°C"
      const dateObj = new Date(f.date);
      const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const tempStr = `${f.tempMax}°C / ${f.tempMin}°C`;
      const tooltip = `${dateStr}: ${desc ? desc + ', ' : ''}${tempStr}`;

      return `<span title="${tooltip}" style="cursor: help; margin-right: 6px; font-size: 1.2em;">${icon}</span>`;
    }).join("");
    weatherDisplay = icons;
  } else if (data.status === "error") {
    weatherDisplay = "n.a.";
  } else if (data.weather) {
    // Fallback to single icon
    const tooltip = `Aktuell: ${data.weather}`;
    weatherDisplay = `<span title="${tooltip}" style="cursor: help; font-size: 1.2em;">${weatherIcon}</span>`;
  } else if (data.status === "static_only") {
    weatherDisplay = "⏳";
  }



  // Details button (for resorts with lift/slope data)
  const hasDetails = (data.lifts && data.lifts.length > 0) || (data.slopes && data.slopes.length > 0);
  const detailsDisplay = hasDetails
    ? `<button class="details-btn" data-resort-id="${data.id}" data-resort-name="${data.name}" title="Lifte & Pisten Details anzeigen">📋</button>`
    : '<span title="Keine Details verfügbar">-</span>';

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
  // Standardized German Classifications
  let typeLabel = data.classification || "Sportlich";
  let typeIcon = "🟡"; // Default
  let typeDesc = "Ausgewogenes Skigebiet";

  const cls = (data.classification || "").toLowerCase();

  // Mapping based on new German values in resorts.json
  if (cls === "familie" || cls.includes("family")) {
    typeLabel = "Familie";
    typeIcon = "🟢";
    typeDesc = "Ideal für Anfänger und Familien - breite, flache Pisten.";
  } else if (cls === "genuss" || cls.includes("scenic")) {
    typeLabel = "Genuss";
    typeIcon = "🟡";
    typeDesc = "Landschaftlich reizvoll, entspanntes Skifahren.";
  } else if (cls === "sportlich" || cls.includes("sport")) {
    typeLabel = "Sportlich";
    typeIcon = "🔴";
    typeDesc = "Anspruchsvollere Pisten für Fortgeschrittene und Könner.";
  } else if (cls === "großraum" || cls.includes("large")) {
    typeLabel = "Großraum";
    typeIcon = "🔴";
    typeDesc = "Sehr großes Skigebiet mit vielen Pistenkilometern.";
  } else if (cls === "gletscher" || cls.includes("glacier")) {
    typeLabel = "Gletscher";
    typeIcon = "⚫";
    typeDesc = "Hochalpines Gletscherskigebiet, absolut schneesicher.";
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
    <td>${standardDisplay}</td>
    <td>${trafficDisplay}</td>
    <td>${distanceDisplay}</td>
    <td>${data.piste_km ?? "-"} km</td>
    <td>${liftStatus}</td>
    <td>${price}</td>
    <td>${typeDisplay}</td>
    <td>${snowDisplay}</td>
    <td>${lastSnowfallDisplay}</td>
    <td>${weatherDisplay}</td>
    <td>${webcamDisplay}</td>
    <td>${detailsDisplay}</td>
    <td>${historyDisplay}</td>
    <td><strong>${score}</strong></td>
  `;
}
