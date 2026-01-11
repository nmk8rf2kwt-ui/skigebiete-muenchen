// Score calculation constants
import { sortResorts } from './sorting.js';
import { escapeHtml } from './utils.js';
import { renderCongestionCell } from './congestionForecast.js';

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


// Helper to format duration in HH:mm
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} h`;
}

export function renderTable(data, sortKey = 'score', filter = 'all', sortDirection = 'desc') {
  const tbody = document.querySelector("#skiTable tbody");
  const top3Container = document.getElementById("top3Cards");
  tbody.innerHTML = "";

  // 1. Enrich data with Score if not present
  let enrichedData = data.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : calculateScore(r)
  }));

  // 2. Filter & View Mode
  if (filter === 'top3') {
    // Show cards, hide table (or show table below)
    // user said "Top 3 heute als Primary UI" -> I'll show cards prominently.
    top3Container.style.display = "grid";

    // Find absolute Top 3 by score
    const top3Data = [...enrichedData].sort((a, b) => b.score - a.score).slice(0, 3);
    renderTop3Cards(top3Data);

    // Also filter table to show top 3 (keeping it below or hidden?)
    // I'll show the table below the cards but filtered to top 3
    enrichedData = top3Data;
  } else {
    top3Container.style.display = "none";
    if (filter.startsWith('top')) {
      const topN = parseInt(filter.replace('top', ''), 10) || 3;
      enrichedData.sort((a, b) => b.score - a.score);
      enrichedData = enrichedData.slice(0, topN);
    } else if (filter === 'open') {
      enrichedData = enrichedData.filter(r => r.liftsOpen > 0);
    }
  }

  // 3. Sort using imported sorting module
  enrichedData = sortResorts(enrichedData, sortKey, sortDirection);

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

function renderTop3Cards(top3) {
  const container = document.getElementById("top3Cards");
  container.innerHTML = "";

  top3.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "top3-card";

    const safeName = escapeHtml(r.name);
    const score = r.score ?? calculateScore(r);

    // Explainability Logic
    let reason = "Top-bewertet für heute!";
    if (r.snow?.mountain > 50 && r.liftsOpen / r.liftsTotal > 0.8) {
      reason = "Hervorragende Schneelage & fast alle Lifte offen.";
    } else if (r.traffic?.delay < 5) {
      reason = "Freie Fahrt & gute Pistenverhältnisse.";
    } else if (r.piste_km > 100) {
      reason = "Maximale Pistenvielfalt im Großraumgebiet.";
    }

    const lastUpdate = r.dataSources?.lifts?.lastUpdated
      ? new Date(r.dataSources.lifts.lastUpdated).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : "unbekannt";

    const isStale = r.dataSources?.lifts?.freshness === 'STALE' || r.dataSources?.lifts?.freshness === 'EXPIRED';
    const staleWarning = isStale ? `<div style="color: #e67e22; font-weight: bold; font-size: 0.75em; margin-bottom: 8px;">⚠️ Daten ggf. veraltet (nicht vertrauenswürdig)</div>` : '';

    card.innerHTML = `
      <div class="top3-header">
        <span class="top3-badge">#${i + 1} HEUTE</span>
        ${staleWarning}
        <h3 class="top3-title">${safeName}</h3>
        <div class="top3-score-box">
          <span class="top3-score-val">${score}</span>
          <span class="top3-score-lbl">Score</span>
        </div>
      </div>
      <div class="top3-content">
        <div class="top3-metric-row">
          <div class="top3-metric">
            <span class="top3-metric-label">Schnee (Berg)</span>
            <span class="top3-metric-value">${r.snow?.mountain ?? '-'} cm</span>
          </div>
          <div class="top3-metric">
            <span class="top3-metric-label">Lifte Offen</span>
            <span class="top3-metric-value">${r.liftsOpen ?? 0} / ${r.liftsTotal ?? r.lifts ?? '?'}</span>
          </div>
        </div>
        <div class="top3-metric-row">
          <div class="top3-metric">
             <span class="top3-metric-label">Fahrzeit</span>
             <span class="top3-metric-value">${Math.round((r.traffic?.duration || 0) / 60 || r.distance || 0)} min</span>
          </div>
          <div class="top3-metric">
             <span class="top3-metric-label">Preis</span>
             <span class="top3-metric-value">€${r.price ?? '-'}</span>
          </div>
        </div>

        <!-- Monetization: Experiment -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
           <a href="${r.website || '#'}" target="_blank" class="affiliate-btn ticket-btn" 
              onclick="import('./utils.js').then(u => u.trackClick('${r.id}', 'ticket'))"
              style="flex: 1; text-align: center; padding: 6px; background: #e67e22; color: white; border-radius: 4px; font-weight: bold; font-size: 0.8em; text-decoration: none;">
              🎟️ Tickets
           </a>
           <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address || r.name)}" target="_blank" class="affiliate-btn route-btn"
              onclick="import('./utils.js').then(u => u.trackClick('${r.id}', 'route'))"
              style="flex: 1; text-align: center; padding: 6px; background: #34495e; color: white; border-radius: 4px; font-weight: bold; font-size: 0.8em; text-decoration: none;">
              🚗 Route
           </a>
        </div>

        <div class="top3-explainability">
          <strong>Warum dieser Platz?</strong><br>
          ${reason}
        </div>
      </div>
      <div class="top3-footer">
        <span class="top3-update">Update: ${lastUpdate}</span>
        <button class="top3-action-btn details-btn" data-resort-id="${r.id}" data-resort-name="${safeName}">Details ➔</button>
      </div>
    `;
    container.appendChild(card);
  });
}


// Helper to get current price based on date (Seasonal Pricing)
function getCurrentPriceDetail(resort) {
  if (!resort.seasons || !resort.seasons.length) {
    return resort.priceDetail;
  }

  // Get local date as YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Find matching season
  const currentSeason = resort.seasons.find(s => {
    return todayStr >= s.start && todayStr <= s.end;
  });

  if (currentSeason) {
    return {
      ...currentSeason.priceDetail,
      // Append season name to info if not present
      info: currentSeason.priceDetail.info || currentSeason.name
    };
  }

  // Fallback to default if no season matches (e.g. out of season)
  return resort.priceDetail;
}

export function renderRow(row, data) {
  // Determine if data is missing or just zero
  // const hasLive = data.status === "live"; // Unused

  // Escape Common Inputs
  const safeName = escapeHtml(data.name);
  const safeWebsite = escapeHtml(data.website);
  const safeWebcam = escapeHtml(data.webcam);

  // Format price
  let price = "-";

  // Dynamic Price Check
  const pd = getCurrentPriceDetail(data);

  if (pd) {
    const cur = pd.currency || "€";
    const fmt = (v) => v ? v.toFixed(2).replace('.', ',') + ' ' + cur : null;

    const pAdult = fmt(pd.adult);
    const pYouth = fmt(pd.youth);
    const pChild = fmt(pd.child);
    const safeInfo = escapeHtml(pd.info || 'Zur Preisübersicht');

    price = `
      <a href="${safeWebsite}" target="_blank" style="text-decoration: none; color: inherit; display: block; font-size: 0.8em; line-height: 1.3; text-align: left;" title="${safeInfo}">
        ${pAdult ? `<div style="white-space: nowrap;">Erw.: ${pAdult}</div>` : ''}
        ${pYouth ? `<div style="white-space: nowrap;">Jugendl.: ${pYouth}</div>` : ''}
        ${pChild ? `<div style="white-space: nowrap;">Kind: ${pChild}</div>` : ''}
      </a>
    `;
  } else if (data.price) {
    price = `€${data.price.toFixed(2)}`;
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
  let standardMins = 0;
  let trafficDisplay = '<span style="color: #bdc3c7; font-size: 0.9em;">-</span>'; // Default gray
  let standardDisplay = "-";
  let delayDisplay = "-";

  // Check if we have live traffic data (duration & delay in seconds from backend)
  if (data.traffic?.loading) {
    trafficDisplay = '<span class="loading-spinner-small"></span>';
    // Use fallback if available
    if (data.staticDuration) standardMins = data.staticDuration;
  } else if (data.traffic && data.traffic.duration) {
    // Backend delivers seconds since v1.4.1 fix
    const durationSecs = data.traffic.duration;
    const delaySecs = data.traffic.delay || 0;

    // Calculate Live & Base Minutes
    const liveMins = Math.round(durationSecs / 60);
    const baseMins = Math.round((durationSecs - delaySecs) / 60);

    standardMins = baseMins;

    // 2. Traffic Time with Color
    const delayMins = Math.round(delaySecs / 60);
    let style = "";
    if (delayMins > 20) style = "color: #e74c3c; font-weight: bold;"; // Red
    else if (delayMins > 10) style = "color: #f39c12; font-weight: bold;"; // Orange
    else if (delayMins > 0) style = "color: #f1c40f;"; // Yellow
    else style = "color: #2ecc71;"; // Green

    const delayText = delayMins > 0 ? ` (+${delayMins} min)` : '';
    const formattedLive = formatDuration(liveMins);
    trafficDisplay = `<span style="${style}" title="Aktuell: ${liveMins} min${escapeHtml(delayText)}">${formattedLive}</span>`;

    // 3. Independent Delay Display
    const formattedDelay = formatDuration(delayMins);
    delayDisplay = `<span style="${style}">${formattedDelay}</span>`;
  } else if (data.staticDuration) {
    // Fallback to static Munich data ONLY if we are in Munich (determined by app.js)
    standardMins = data.staticDuration;
    if (data.status === "live") {
      // Improved error visibility for live resorts missing traffic data
      trafficDisplay = `<span title="Verkehrsdaten konnten nicht geladen werden" style="color: #e67e22; font-weight: bold; cursor: help;">⚠️ n.a.</span>`;
    }
  }

  // Render Standard Display (Column 1)
  if (standardMins > 0) {
    const timeText = formatDuration(standardMins);
    if (data.latitude && data.longitude) {
      const destQuery = data.address ? encodeURIComponent(data.address) : `${data.latitude},${data.longitude}`;
      // Note: If we use static time, we might still want to link to directions from current location?
      // Yes, current location is in data? No.
      // Directions link usually assumes "current user location" or specific origin.
      // Google Maps "dir" without origin uses user's current location.
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
      const title = data.traffic ? `Fahrzeit ohne Verkehr (Live-Basis: ${standardMins} min)` : `Fahrzeit ab München (Statisch: ${standardMins} min)`;
      standardDisplay = `<a href="${mapsUrl}" target="_blank" title="${title}" style="text-decoration: underline; text-decoration-style: dotted; color: inherit;">${timeText}</a>`;
    } else {
      standardDisplay = timeText;
    }
  }

  // ... (Snow Display logic starts) ...


  // Snow Display - use forecast data if available
  let snowDisplay = "-";
  // Check for new object structure first
  if (data.snow && typeof data.snow === 'object') {
    const s = data.snow;
    // const mountain = s.mountain !== null ? `${s.mountain} cm` : "-";
    // const valley = s.valley !== null ? `${s.valley} cm` : "-";

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
    const safeState = escapeHtml(s.state || ''); // Ensure s.state is treated as string for escapeHtml
    const tooltip = `${sourceTitle}${timestamp ? ` (Stand: ${timestamp})` : ''}${safeState ? `\nZustand: ${safeState}` : ''}`;

    snowDisplay = `<span title="${escapeHtml(tooltip)}" style="border-bottom: 2px solid ${sourceColor}; cursor: help;">${text}</span>`;

  } else if (data.snow) {
    // Fallback to old format (string)
    snowDisplay = escapeHtml(data.snow);
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
    // Fix: Handle future dates (e.g. from different timezones or forecast data) by clamping to 0
    const diffTime = today - snowDate;
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0;

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
      const safeDesc = escapeHtml(desc);
      const tooltip = `${dateStr}: ${safeDesc ? safeDesc + ', ' : ''}${tempStr}`;

      // Short Date: "26.1."
      const shortDate = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

      return `
        <div style="display: flex; flex-direction: column; align-items: center; margin-right: 8px;" title="${escapeHtml(tooltip)}">
          <span style="font-size: 0.7em; font-weight: bold; color: #444; margin-bottom: 2px;">${Math.round(f.tempMax)}°/${Math.round(f.tempMin)}°</span>
          <span style="font-size: 1.8em; cursor: help;">${icon}</span>
          <span style="font-size: 0.7em; color: #666; margin-top: -2px;">${shortDate}</span>
        </div>
      `;
    }).join("");
    // Flex container for the days
    weatherDisplay = `<div style="display: flex;">${icons}</div>`;
  } else if (data.status === "error") {
    weatherDisplay = "n.a.";
  } else if (data.weather) {
    // Fallback to single icon
    const safeWeather = escapeHtml(data.weather);
    const tooltip = `Aktuell: ${safeWeather}`;
    weatherDisplay = `<span title="${escapeHtml(tooltip)}" style="cursor: help; font-size: 1.2em;">${weatherIcon}</span>`;
  } else if (data.status === "static_only") {
    weatherDisplay = "⏳";
  }



  // Details button (for resorts with lift/slope data)
  const hasLifts = Array.isArray(data.lifts) && data.lifts.length > 0;
  const hasSlopes = Array.isArray(data.slopes) && data.slopes.length > 0;

  if (data.status === 'live' && !hasLifts && !hasSlopes) {
    // Debug log to trace why button might be missing for live resorts
    // console.debug(`[Render] Resort ${data.id} is live but has no details arrays. Lifts: ${typeof data.lifts}, Slopes: ${typeof data.slopes}`);
  }

  const hasDetails = hasLifts || hasSlopes;
  const detailsDisplay = hasDetails
    ? `<button class="details-btn" data-resort-id="${data.id}" data-resort-name="${safeName}" title="Lifte & Pisten Details anzeigen">📋</button>`
    : '<span title="Keine Details verfügbar">-</span>';

  // History button - REMOVED
  // Traffic Analysis is now triggered via the Traffic Trend column
  const historyDisplay = "";

  // Score
  const score = data.score ?? "-";

  // Data Freshness Display (replaces old traffic light)
  // Format time helper
  const formatFreshnessTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Get freshness class
  const getFreshnessClass = (state) => {
    if (!state) return '';
    return state.toLowerCase(); // fresh, degraded, stale, expired
  };

  // Build data freshness display
  const dataSources = data.dataSources || {};

  const liftsInfo = dataSources.lifts || {};
  const weatherInfo = dataSources.weather || {};
  const snowInfo = dataSources.snow || {};
  const trafficInfo = dataSources.traffic || {};

  const dataFreshnessDisplay = `
    <div class="data-freshness">
      <div class="freshness-item ${getFreshnessClass(liftsInfo.freshness)}" title="${liftsInfo.source || 'Unknown'} (${liftsInfo.type || 'N/A'})${liftsInfo.sourceUrl ? '\n' + liftsInfo.sourceUrl : ''}">
        🚠 <span class="freshness-time">${formatFreshnessTime(liftsInfo.lastUpdated)}</span>
      </div>
      <div class="freshness-item ${getFreshnessClass(weatherInfo.freshness)}" title="${weatherInfo.source || 'Unknown'}${weatherInfo.sourceUrl ? '\n' + weatherInfo.sourceUrl : ''}">
        🌤️ <span class="freshness-time">${formatFreshnessTime(weatherInfo.lastUpdated)}</span>
      </div>
      <div class="freshness-item ${getFreshnessClass(snowInfo.freshness)}" title="${snowInfo.source || 'Unknown'}${snowInfo.sourceUrl ? '\n' + snowInfo.sourceUrl : ''}">
        ❄️ <span class="freshness-time">${formatFreshnessTime(snowInfo.lastUpdated)}</span>
      </div>
      <div class="freshness-item ${getFreshnessClass(trafficInfo.freshness)}" title="${trafficInfo.source || 'Unknown'}${trafficInfo.sourceUrl ? '\n' + trafficInfo.sourceUrl : ''}">
        🚗 <span class="freshness-time">${formatFreshnessTime(trafficInfo.lastUpdated)}</span>
      </div>
    </div>
  `;

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
  } else if (cls.includes("großraum") || cls.includes("large")) {
    typeIcon = "🔵";
    typeDesc = "Große Pistenvielfalt";
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
  const webcamDisplay = safeWebcam
    ? `<a href="${safeWebcam}" target="_blank" title="Webcam öffnen" style="text-decoration: none;">📷</a>`
    : '<span title="Keine Webcam verfügbar">-</span>';

  // Distance (in km) - priority: Traffic API -> Air Distance
  let distanceDisplay = "-";

  if (data.traffic?.loading) {
    distanceDisplay = '<span class="loading-spinner-small"></span>';
  } else {
    // Priority 1: Road distance from Traffic API
    const roadKm = data.traffic?.distanceKm || data.distanceKm; // handle both structures

    // Priority 2: Calculated linear distance (Air)
    const airKm = data.linearDistance;

    if (roadKm) {
      distanceDisplay = `${roadKm} km`;
    } else if (airKm) {
      // Show air distance with indication
      distanceDisplay = `<span title="Luftlinie (Keine Routendaten verfügbar)" style="cursor: help; border-bottom: 1px dotted #999;">${airKm} km ✈️</span>`;
    } else {
      distanceDisplay = "-";
    }
  }

  // Combined Weather & Snow Display
  // Combined Weather & Snow Display (Removed)

  // SmartScore display (use new smartScore from backend, fallback to old score)
  const smartScore = data.smartScore ?? score;
  const isStale = data.dataSources?.lifts?.freshness === 'STALE' || data.dataSources?.lifts?.freshness === 'EXPIRED';
  const smartScoreDisplay = smartScore !== '-' && smartScore !== null
    ? `<strong title="SmartScore: ${smartScore}/100" style="${isStale ? 'color: #e67e22;' : ''}">${smartScore}${isStale ? ' ⚠️' : ''}</strong>`
    : '<span style="color: #999;">-</span>';

  row.innerHTML = `
    <td>${dataFreshnessDisplay}</td>
    <td><a href="${safeWebsite}" target="_blank" style="text-decoration: none; color: inherit; font-weight: bold;">${safeName}</a></td>
    <td>${typeDisplay}</td>
    <td>${data.piste_km ?? "-"} km</td>
    <td>${liftStatus}</td>
    <td>${price}</td>
    <td>${distanceDisplay}</td>
    <td>${standardDisplay}</td>
    <td>${delayDisplay}</td>
    <td>${trafficDisplay}</td>
    ${renderCongestionCell(data, data.id)}
    <!-- Separate Conditions Columns -->
    <td style="text-align: center; background-color: #f8f9fa; border-left: 2px solid #ecf0f1;">${weatherDisplay}</td>
    <td style="background-color: #f8f9fa; border-right: 2px solid #ecf0f1;">
      <div style="display: flex; flex-direction: column; gap: 2px; font-size: 0.9em;">
         <span>${snowDisplay}</span>
         <span style="color: #7f8c8d; font-size: 0.85em;">${lastSnowfallDisplay !== '-' ? '❄️ ' + lastSnowfallDisplay : ''}</span>
      </div>
    </td>
    <td>${webcamDisplay}</td>
    <td>
      <div style="display: flex; gap: 4px;">
        <a href="${r.website || '#'}" target="_blank" onclick="import('./utils.js').then(u=>u.trackClick('${data.id}', 'ticket'))" title="Tickets buchen" style="text-decoration:none; font-size:1.1em;">🎟️</a>
        ${detailsDisplay}
      </div>
    </td>
    <td>${smartScoreDisplay}</td>
  `;
}
