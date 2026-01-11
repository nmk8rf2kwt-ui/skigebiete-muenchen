// Score calculation constants
import { sortResorts } from './sorting.js';
import { escapeHtml } from './utils.js';
import { renderCongestionCell } from './congestionForecast.js';

import { store } from './store.js';
import { DOMAIN_CONFIGS } from './domainConfigs.js';

const SCORE_WEIGHTS = {
  PISTE_KM: 2,
  DISTANCE: -0.5,
  PRICE: -0.5,
  OPEN_LIFTS: 3,
  SNOW: 0.5,
  TRAFFIC_DELAY: -2.0,
  FAMILY_BONUS: 30,
  DEFAULT_DISTANCE: 100,
  DEFAULT_PRICE: 50
};

// Helper to calculate a score for ranking
export function calculateScore(resort) {
  const pref = store.get().preference || 'fast';

  const piste = resort.piste_km || 0;
  const dist = resort.distance || SCORE_WEIGHTS.DEFAULT_DISTANCE;
  const price = resort.price || SCORE_WEIGHTS.DEFAULT_PRICE;
  const openLifts = resort.liftsOpen || 0;
  const snow = resort.snow?.mountain ?? 0;
  // Traffic delay in minutes
  const trafficDelayMins = (resort.traffic?.delay || 0) / 60;

  // Classification check
  const cls = (resort.classification || "").toLowerCase();
  const isFamily = cls.includes("familie") || cls.includes("family") || cls.includes("anfänger") || (piste > 0 && piste < 30);

  let weights = { ...SCORE_WEIGHTS };

  // Adjust weights based on preference
  if (pref === 'fast') {
    weights.DISTANCE = -2.0;
    weights.TRAFFIC_DELAY = -1.0;
  } else if (pref === 'near') {
    weights.DISTANCE = -3.0;
    weights.TRAFFIC_DELAY = -0.5;
  } else if (pref === 'traffic') {
    weights.TRAFFIC_DELAY = -5.0;
    weights.DISTANCE = -0.5;
  } else if (pref === 'variety') {
    weights.PISTE_KM = 4.0;
    weights.OPEN_LIFTS = 5.0;
  } else if (pref === 'family') {
    weights.PRICE = -2.0;
    weights.DISTANCE = -1.0;
  } else if (pref === 'snow') {
    weights.SNOW = 3.0;
  } else if (pref === 'open') {
    weights.OPEN_LIFTS = 6.0;
  } else if (pref === 'price') {
    weights.PRICE = -2.0;
  }

  let score =
    (piste * weights.PISTE_KM) +
    (dist * weights.DISTANCE) +
    (price * weights.PRICE) +
    (openLifts * weights.OPEN_LIFTS) +
    (snow * weights.SNOW) +
    (trafficDelayMins * weights.TRAFFIC_DELAY);

  if (pref === 'family' && isFamily) {
    score += weights.FAMILY_BONUS;
  }

  // Sled specific overrides
  if (resort.has_lift) score += 20;
  if (resort.length > 5) score += 10;
  if (resort.night_light && pref === 'variety') score += 15;

  return Math.round(score);
}

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

export function renderTable(data, sortKey = 'score', filter = 'top3', sortDirection = 'desc') {
  const tbody = document.querySelector("#skiTable tbody");
  const top3Container = document.getElementById("top3Cards");
  const mapView = document.getElementById("map-view");
  const skiTable = document.getElementById("skiTable");
  const expandContainer = document.getElementById("expandContainer");
  const viewMode = store.get().viewMode || 'top3';

  // Update Timestamp
  const tsElement = document.getElementById("timestamp");
  if (tsElement) {
    tsElement.textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  // 1. Enrich data with Score if not present
  let enrichedData = data.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : calculateScore(r)
  }));

  // 2. View Mode & Filtering Logic
  if (viewMode === 'map') {
    top3Container.style.display = "none";
    if (expandContainer) expandContainer.style.display = "none";
    skiTable.style.display = "none";
    mapView.style.display = "block";

    // Trigger Map Refresh (Map module handles the actual markers)
    import('./map.js').then(m => m.updateMap(enrichedData));
    return; // Fast exit for map
  }

  if (viewMode === 'top3' || viewMode === 'cards') {
    mapView.style.display = "none";
    skiTable.style.display = "none";
    top3Container.style.display = "grid";

    // Expansion Level
    let limit = 3;
    if (filter === 'top5') limit = 5;
    if (filter === 'top10') limit = 10;
    if (filter === 'all') limit = 1000;

    const displayData = [...enrichedData].sort((a, b) => b.score - a.score).slice(0, limit);
    renderTop3Cards(displayData, limit > 3);

    // Show Expand button if we have more but aren't showing all
    if (expandContainer) {
      expandContainer.style.display = (limit < enrichedData.length && filter !== 'all') ? "block" : "none";
      if (filter === 'top10') {
        document.getElementById("expandBtn").textContent = "✨ Alle Skigebiete anzeigen";
      } else {
        document.getElementById("expandBtn").textContent = "✨ Weitere Skigebiete entdecken";
      }
    }
  } else {
    // TABLE VIEW (Legacy or Explicit)
    mapView.style.display = "none";
    top3Container.style.display = "none";
    if (expandContainer) expandContainer.style.display = "none";
    skiTable.style.display = "table";

    if (filter.startsWith('top')) {
      const topN = parseInt(filter.replace('top', ''), 10) || 3;
      enrichedData.sort((a, b) => b.score - a.score);
      enrichedData = enrichedData.slice(0, topN);
    } else if (filter === 'open') {
      enrichedData = enrichedData.filter(r => r.liftsOpen > 0);
    }

    // 3. Sort using imported sorting module
    enrichedData = sortResorts(enrichedData, sortKey, sortDirection);

    // 4. Render Rows
    tbody.innerHTML = "";
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
}

export function renderTop3Cards(topData, isExpanded = false) {
  const container = document.getElementById("top3Cards");
  const domainId = store.get().currentDomain || 'ski';
  const config = DOMAIN_CONFIGS[domainId];
  const userPref = store.get().preference || config.prefs[0].id;

  if (!container) return;
  container.innerHTML = "";

  topData.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "top3-card";
    const score = r.smartScore ?? r.score ?? 0;

    // Generate Reasoning List (Simplified/Generalized)
    const reasons = generateReasoning(r, userPref, domainId);
    const safeName = escapeHtml(r.name);

    // Metadata-driven Metrics
    const metricsHtml = config.metrics.map(m => `
      <div class="metric-box">
          <span class="metric-icon">${m.icon}</span>
          <strong class="metric-value">${m.formatter(r)}</strong>
          <span class="metric-label">${m.label}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="top3-header-new">
        <span class="top3-badge">
            ${isExpanded ? '#' + (i + 1) : '🏆 # ' + (i + 1) + ' FÜR HEUTE'}
        </span>
        <h3 class="top3-resort-name">${safeName} <span class="text-sm text-gray">(${score})</span></h3>
      </div>
      
      <div class="metrics-container">
        ${metricsHtml}
      </div>

      <div class="reasoning-container">
          <div class="reasoning-summary" data-action="toggle-reasoning">
              <span>Warum diese Wahl?</span>
              <span class="toggle-icon">▾</span>
          </div>
        <ul class="reasoning-list">
            ${reasons.map(reason => `
                <li class="reasoning-item">
                    <span>${reason.icon}</span>
                    <span>${reason.text}</span>
                </li>
            `).join('')}
        </ul>
      </div>

      <div class="top3-outcomes outcomes-container">
        <button class="outcome-btn-route" data-action="route" data-destination="${encodeURIComponent(r.address || r.name)}">Anfahrt öffnen ➔</button>
        <div class="action-buttons-row">
            <button class="action-btn" data-action="share" data-title="${safeName}" data-url="${window.location.href}">Teilen 🔗</button>
            <button class="action-btn" data-action="save">Merken ⭐</button>
            ${domainId === 'ski' ? `<button class="action-btn" data-action="details" data-resort-id="${r.id}" data-resort-name="${safeName}">Details 📋</button>` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function generateReasoning(resort, pref, domainId = 'ski') {
  const reasons = [];

  if (domainId === 'ski') {
    const liftPct = resort.liftsOpen / (resort.liftsTotal || resort.lifts || 1);
    const snow = resort.snow?.mountain ?? 0;
    const eta = Math.round((resort.traffic?.duration || 0) / 60 || resort.distance || 0);

    if (liftPct > 0.8) reasons.push({ type: 'good', icon: '✅', text: `${Math.round(liftPct * 100)}% Lifte offen` });
    else if (liftPct > 0.5) reasons.push({ type: 'ok', icon: '⚠️', text: `Nur ${Math.round(liftPct * 100)}% Lifte offen` });

    if (snow > 80) reasons.push({ type: 'good', icon: '✅', text: `${snow} cm Schnee (Top)` });
    else if (snow > 30) reasons.push({ type: 'ok', icon: '✅', text: `${snow} cm Schnee` });

    if (eta < 90) reasons.push({ type: 'good', icon: '✅', text: `Schnelle Anfahrt (${eta} min)` });
    else if (eta > 150) reasons.push({ type: 'bad', icon: '⚠️', text: `Längere Anfahrt (${eta} min)` });
  } else if (domainId === 'sled') {
    // Sledding specific reasoning
    if (resort.length > 3) reasons.push({ type: 'good', icon: '📏', text: `Extra lange Bahn (${resort.length} km)` });
    if (resort.has_lift) reasons.push({ type: 'good', icon: '🚠', text: 'Aufstiegshilfe vorhanden' });
    if (resort.night_light) reasons.push({ type: 'ok', icon: '🌙', text: 'Nachtrodeln möglich' });
    if (resort.walk_min > 30 && !resort.has_lift) reasons.push({ type: 'bad', icon: '🥾', text: `${resort.walk_min} min Aufstieg` });
  } else {
    // Basic reasons for other placeholder domains
    reasons.push({ type: 'good', icon: '✅', text: 'Heute gute Bedingungen' });
    reasons.push({ type: 'ok', icon: '📍', text: 'Gut erreichbar' });
  }

  return reasons;
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
      <a href="${safeWebsite}" target="_blank" class="price-link" title="${safeInfo}">
        ${pAdult ? `<div class="no-wrap">Erw.: ${pAdult}</div>` : ''}
        ${pYouth ? `<div class="no-wrap">Jugendl.: ${pYouth}</div>` : ''}
        ${pChild ? `<div class="no-wrap">Kind: ${pChild}</div>` : ''}
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
  let trafficDisplay = '<span class="text-md text-gray">-</span>'; // Default gray
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
    let styleClass = "";
    if (delayMins > 20) styleClass = "text-danger font-bold";
    else if (delayMins > 10) styleClass = "text-orange font-bold";
    else if (delayMins > 0) styleClass = "text-warning";
    else styleClass = "text-success";

    const delayText = delayMins > 0 ? ` (+${delayMins} min)` : '';
    const formattedLive = formatDuration(liveMins);
    trafficDisplay = `<span class="${styleClass}" title="Aktuell: ${liveMins} min${escapeHtml(delayText)}">${formattedLive}</span>`;

    // 3. Independent Delay Display
    const formattedDelay = formatDuration(delayMins);
    delayDisplay = `<span class="${styleClass}">${formattedDelay}</span>`;
  } else if (data.staticDuration) {
    // Fallback to static Munich data ONLY if we are in Munich (determined by app.js)
    standardMins = data.staticDuration;
    if (data.status === "live") {
      // Improved error visibility for live resorts missing traffic data
      trafficDisplay = `<span title="Verkehrsdaten konnten nicht geladen werden" class="text-orange font-bold cursor-help">⚠️ n.a.</span>`;
    }
  }

  // Render Standard Display (Column 1)
  if (standardMins > 0) {
    const timeText = formatDuration(standardMins);
    if (data.latitude && data.longitude) {
      const destQuery = data.address ? encodeURIComponent(data.address) : `${data.latitude},${data.longitude}`;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
      const title = data.traffic ? `Fahrzeit ohne Verkehr (Live-Basis: ${standardMins} min)` : `Fahrzeit ab München (Statisch: ${standardMins} min)`;
      standardDisplay = `<a href="${mapsUrl}" target="_blank" title="${title}" class="decoration-underline text-link dashed">${timeText}</a>`;
    } else {
      standardDisplay = timeText;
    }
  }

  // Snow Display - use forecast data if available
  let snowDisplay = "-";
  // Check for new object structure first
  if (data.snow && typeof data.snow === 'object') {
    const s = data.snow;

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
    // We use utility classes border-b with color
    // We need dynamic border colors, but we can't use style. 
    // We can define .border-warning and .border-success
    // s.source === 'api' ? '#f1c40f' : '#2ecc71';

    // Inline style here is actually dynamic (source driven). 
    // BUT strictly, we should use classes.
    const borderClass = s.source === 'api' ? 'border-b-warning' : 'border-b-success';
    // To implement strict CSP we need these classes in CSS or just use inline style with nonce (hard).
    // I added .border-l-success but not border-b-* colors. 
    // I will use style for border-color for now? NO. Strict CSP fails with style.
    // I will stick to adding the detailed classes or reusing what I have.
    // I'll make a compromise: I'll trust my basic classes if possible, 
    // or just assume greenish (it's mostly just visualized).
    // Actually, I'll use `style="border-bottom: 2px solid ..."` -> this is inline!
    // I will skip the border color dynamic for now or map it to class.

    const sourceClass = s.source === 'api' ? 'text-warning' : 'text-success';
    // Using text color instead of border-bottom for simplicity in strict CSP:
    // Or I can use a class "source-api" vs "source-official" and style them in CSS.
    // Since I can't edit CSS right this second inside this file write, I'll use existing utility text-colors to underline/highlight.

    const sourceTitle = s.source === 'api'
      ? 'Daten von Wetter-API (geschätzt/Fallback)'
      : 'Offizielle Daten vom Skigebiet';

    const timestamp = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
    const safeState = escapeHtml(s.state || '');
    const tooltip = `${sourceTitle}${timestamp ? ` (Stand: ${timestamp})` : ''}${safeState ? `\nZustand: ${safeState}` : ''}`;

    snowDisplay = `<span title="${escapeHtml(tooltip)}" class="cursor-help border-b ${sourceClass === 'text-warning' ? 'border-dashed' : 'border-solid'}">${text}</span>`;

  } else if (data.snow) {
    // Fallback to old format (string)
    snowDisplay = escapeHtml(data.snow);
  } else if (data.status === "error") {
    snowDisplay = "n.a.";
  }

  // Last Snowfall Display - check nested structure
  let lastSnowfallDisplay = "-";
  const lastSnowfallDate = data.snow?.lastSnowfall || data.forecast?.lastSnowfall || data.lastSnowfall;

  if (lastSnowfallDate) {
    const snowDate = new Date(lastSnowfallDate);
    const today = new Date();
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

  const forecastArray = data.forecast?.forecast || data.forecast;

  if (forecastArray && Array.isArray(forecastArray) && forecastArray.length >= 3) {
    const icons = forecastArray.slice(0, 3).map(f => {
      let icon = f.weatherEmoji;
      let desc = f.weatherDesc || f.weather || "";

      if (!icon || /[a-zA-Z]/.test(icon)) {
        icon = getWeatherIcon(f.weather || f.weatherDesc || icon || "");
      }

      if (!desc && /[a-zA-Z]/.test(f.weather)) desc = f.weather;

      const dateObj = new Date(f.date);
      const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const tempStr = `${f.tempMax}°C / ${f.tempMin}°C`;
      const safeDesc = escapeHtml(desc);
      const tooltip = `${dateStr}: ${safeDesc ? safeDesc + ', ' : ''}${tempStr}`;
      const shortDate = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

      return `
        <div class="forecast-day" title="${escapeHtml(tooltip)}">
          <span class="forecast-temp">${Math.round(f.tempMax)}°/${Math.round(f.tempMin)}°</span>
          <span role="img" aria-label="${safeDesc || 'Wetter'}" class="forecast-icon">${icon}</span>
          <span class="forecast-date">${shortDate}</span>
        </div>
      `;
    }).join("");
    weatherDisplay = `<div class="d-flex">${icons}</div>`;
  } else if (data.status === "error") {
    weatherDisplay = "n.a.";
  } else if (data.weather) {
    const safeWeather = escapeHtml(data.weather);
    const tooltip = `Aktuell: ${safeWeather}`;
    weatherDisplay = `<span role="img" aria-label="${safeWeather}" title="${escapeHtml(tooltip)}" class="cursor-help text-xl">${weatherIcon}</span>`;
  } else if (data.status === "static_only") {
    weatherDisplay = "⏳";
  }

  const hasLifts = Array.isArray(data.lifts) && data.lifts.length > 0;
  const hasSlopes = Array.isArray(data.slopes) && data.slopes.length > 0;

  const hasDetails = hasLifts || hasSlopes;
  const detailsDisplay = hasDetails
    ? `<button class="details-btn" data-action="details" data-resort-id="${data.id}" data-resort-name="${safeName}" title="Lifte & Pisten Details anzeigen">📋</button>`
    : '<span title="Keine Details verfügbar">-</span>';

  // Score
  const score = data.score ?? "-";

  // Data Freshness Display
  const formatFreshnessTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getFreshnessClass = (state) => {
    if (!state) return '';
    return state.toLowerCase();
  };

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
  let typeLabel = data.classification || "Sportlich";
  let typeIcon = "🟡";
  let typeDesc = "Ausgewogenes Skigebiet";

  const cls = (data.classification || "").toLowerCase();

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

  const typeDisplay = `<span title="${typeDesc}" class="cursor-help">${typeIcon} ${typeLabel}</span>`;

  const webcamDisplay = safeWebcam
    ? `<a href="${safeWebcam}" target="_blank" title="Webcam öffnen" class="decoration-none text-2xl webcam-link">📷</a>`
    : '<span title="Keine Webcam verfügbar">-</span>';

  // Distance (in km)
  let distanceDisplay = "-";

  if (data.traffic?.loading) {
    distanceDisplay = '<span class="loading-spinner-small"></span>';
  } else {
    const roadKm = data.traffic?.distanceKm || data.distanceKm;
    const airKm = data.linearDistance;

    if (roadKm) {
      distanceDisplay = `${roadKm} km`;
    } else if (airKm) {
      distanceDisplay = `<span title="Luftlinie (Keine Routendaten verfügbar)" class="cursor-help border-dashed border-b">${airKm} km ✈️</span>`;
    } else {
      distanceDisplay = "-";
    }
  }

  // SmartScore display
  const smartScore = data.smartScore ?? score;
  const isStale = data.dataSources?.lifts?.freshness === 'STALE' || data.dataSources?.lifts?.freshness === 'EXPIRED';
  const smartScoreClass = isStale ? 'text-orange' : '';
  const smartScoreDisplay = smartScore !== '-' && smartScore !== null
    ? `<strong title="SmartScore: ${smartScore}/100" class="${smartScoreClass}">${smartScore}${isStale ? ' ⚠️' : ''}</strong>`
    : '<span class="text-gray">-</span>';

  row.innerHTML = `
    <td>${dataFreshnessDisplay}</td>
    <td><a href="${safeWebsite}" target="_blank" class="decoration-none font-bold text-dark">${safeName}</a></td>
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
    <td class="weather-cell">${weatherDisplay}</td>
    <td class="snow-cell">
      <div class="d-flex flex-col gap-xs text-md">
         <span>${snowDisplay}</span>
         <span class="text-sm text-gray">${lastSnowfallDisplay !== '-' ? '❄️ ' + lastSnowfallDisplay : ''}</span>
      </div>
    </td>
    <td>${webcamDisplay}</td>
    <td>
      <div class="d-flex gap-xs">
        <a href="${data.website || '#'}" target="_blank" data-action="ticket" data-id="${data.id}" title="Tickets buchen" class="text-lg decoration-none">🎟️</a>
        ${detailsDisplay}
      </div>
    </td>
    <td>${smartScoreDisplay}</td>
  `;
}
