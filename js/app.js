import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap, showUserLocation } from "./map.js";
import { API_BASE_URL } from "./config.js";
import { store } from "./store.js";
import { escapeHtml } from "./utils.js";

// Global Error Handler
// Global Error Handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
  showError(`Global Error: ${msg} (Line: ${lineNo})`);
  return false;
};

// Munich Marienplatz coordinates (default)
const MUNICH_DEFAULT = {
  latitude: 48.1351,
  longitude: 11.5820,
  name: "München Innenstadt"
};

// Show message in UI (persistent for debugging)
// Show message in UI (persistent for debugging)
function showError(message) {
  const container = document.getElementById("searchError");
  const content = document.getElementById("errorContent");
  if (!container || !content) return;

  container.style.display = "block";

  const msgDiv = document.createElement("div");
  msgDiv.textContent = `❌ ${message}`;
  msgDiv.style.color = "#d32f2f";
  content.appendChild(msgDiv);

  // Auto-scroll to bottom
  content.scrollTop = content.scrollHeight;
}

function logToUI(msg, type = "info") {
  const container = type === "error" ? document.getElementById("searchError") : document.getElementById("statusConsole");
  const content = type === "error" ? document.getElementById("errorContent") : document.getElementById("statusContent");

  if (!container || !content) return;

  // Always show status console when logging, unless explicit hide logic exists
  container.style.display = "block";

  const line = document.createElement("div");
  // Keep clean style
  line.style.borderBottom = "1px solid #eee";
  line.style.padding = "2px 0";

  const timestamp = new Date().toLocaleTimeString();

  if (type === "error") {
    line.innerHTML = `<span style="color:#d32f2f">❌ [${timestamp}] ${msg}</span>`;
  } else {
    // Check for specific keywords to add emojis or formatting
    let icon = "ℹ️";
    if (msg.includes("Lade")) icon = "⏳";
    if (msg.includes("aktualisiert") || msg.includes("Loaded")) icon = "✅";
    if (msg.includes("Verkehr")) icon = "🚦";
    if (msg.includes("Wetter")) icon = "🌤️";

    line.innerHTML = `<span style="color:#555">[${timestamp}] ${icon} ${msg}</span>`;
  }

  content.appendChild(line);
  content.scrollTop = content.scrollHeight;
}

// Hide error message
function hideError() {
  // Disable auto-hide for debugging
}

// Show Loading Banner
function showLoading(msg = "Lade Live-Daten...") {
  const banner = document.getElementById("loadingBanner");
  const text = document.getElementById("loadingText");
  if (banner && text) {
    text.textContent = msg;
    banner.style.display = "flex";
  }
}

// Hide Loading Banner
function hideLoading() {
  const banner = document.getElementById("loadingBanner");
  if (banner) banner.style.display = "none";
}

// Load Data
async function load() {
  showLoading("🚀 Starte App...");

  // 1. Fetch Static Data Fast
  try {
    showLoading("Lade Basis-Daten...");
    logToUI("Lade statische Konfiguration der Skigebiete...");
    const staticRes = await fetch(`${API_BASE_URL}/resorts/static`);

    if (!staticRes.ok) throw new Error(`HTTP ${staticRes.status}`);
    const staticData = await staticRes.json();
    logToUI(`✅ ${staticData.length} Skigebiete konfiguriert.`);

    // Check if we already have resorts in store to avoid flicker
    if (store.get().resorts.length === 0) {
      store.setState({ resorts: staticData }, render);
    }
  } catch (err) {
    console.error("Failed to load static data:", err);
    showError(`❌ Basis-Daten Fehler: ${err.message}`);
  }

  // 2. Fetch Live Data
  try {
    showLoading("Lade Live-Status...");
    logToUI("Frage Live-Daten ab (Intermaps, Resort-Websites, OpenMeteo)...", "loading");
    const liveRes = await fetch(`${API_BASE_URL}/resorts`);

    if (!liveRes.ok) {
      // Detailed Error Mapping
      if (liveRes.status === 503) throw new Error("Backend wird gestartet (ca. 30s)...");
      if (liveRes.status === 504) throw new Error("Zeitüberschreitung beim Laden");
      throw new Error(`Server Status ${liveRes.status}`);
    }

    const liveData = await liveRes.json();
    logToUI(`✅ Live-Daten für ${liveData.length} Gebiete empfangen.`);

    // Log individual updates
    let updateCount = 0;
    liveData.forEach(r => {
      // Log if Fresh (not cached) AND Live
      if (r.status === "live" && r.cached === false) {
        updateCount++;
        logToUI(`🔄 ${r.name}: Daten erfolgreich aktualisiert.`);
      }
      // Log errors (fresh only to avoid spamming on every poll? Or always? Let's do fresh)
      else if (r.status === "error" && r.cached === false) {
        logToUI(`⚠️ ${r.name}: Fehler beim Aktualisieren.`, "error");
      }
    });

    if (updateCount > 0) {
      logToUI(`📊 ${updateCount} Skigebiete wurden in diesem Durchlauf aktualisiert.`);
    } else {
      logToUI("ℹ️ Keine Änderungen (Daten aus Cache).");
    }

    logToUI("Wetterinfos und Schneehöhen aktualisiert.");

    store.setState({ resorts: liveData, lastUpdated: new Date() }, render);

    // Update timestamp
    const ts = document.getElementById("timestamp");
    if (ts) ts.innerText = new Date().toLocaleTimeString();

    // 3. Calculate initial traffic/distance from Munich
    showLoading("Berechne Verkehr...");
    logToUI(`Berechne Fahrzeiten ab ${MUNICH_DEFAULT.name} (OpenRouteService)...`);
    await fetchTrafficForLocation(MUNICH_DEFAULT.latitude, MUNICH_DEFAULT.longitude, MUNICH_DEFAULT.name);

    hideLoading();

  } catch (err) {
    console.error("Failed to load live data:", err);
    showError(`❌ Live-Daten Fehler: ${err.message}`);
    logToUI(`❌ Fehler beim Laden der Live-Daten: ${err.message}`, "error");
    // Keep banner visible but red? Or hide? Let's hide and use persistent error
    hideLoading();
  }
}

// Export CSV
function exportToCsv() {
  const allResorts = store.get().resorts;
  if (!allResorts.length) return;

  const headers = ["Name", "Reisezeit (min)", "Pisten (km)", "Lifte (Offen/Total)", "Preis (€)", "Typ", "Schnee", "Wetter", "Score"];
  const rows = allResorts.map(r => {
    // Re-calculate or use raw data. Note: renderTable calculates score but doesn't persist it to allResorts unless we mutate.
    const liftStatus = r.liftsTotal ? `${r.liftsOpen || 0}/${r.liftsTotal}` : "-";
    return [
      `"${r.name}"`,
      r.distance || 0,
      r.piste_km || 0,
      `"${liftStatus}"`,
      r.price || 0,
      `"${r.classification || ''}"`,
      `"${r.snow || ''}"`,
      `"${r.weather || ''}"`,
      r.score || 0
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + rows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `skigebiete_ranking_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function fetchTrafficForLocation(lat, lon, locationName = "custom location") {
  logToUI(`Berechne Fahrzeiten von ${locationName}...`);

  // 1. Show loading state for all resorts
  const currentResorts = store.get().resorts;
  const loadingResorts = currentResorts.map(r => ({
    ...r,
    traffic: { loading: true }
  }));
  store.setState({ resorts: loadingResorts }, render);

  try {
    const res = await fetch(`${API_BASE_URL}/traffic/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const trafficMap = await res.json();

    showUserLocation(lat, lon);

    // 2. Update resorts with traffic data
    // Note: OpenRouteService Matrix API (free) usually returns "driving times based on speed limits", 
    // effectively "Standard Time without Traffic". Real-time traffic is not included in standard ORS Matrix.

    const isDefaultLocation = locationName === "München Innenstadt" || locationName === "München"; // Basic check

    const updatedResorts = currentResorts.map(resort => {
      const data = trafficMap[resort.id];
      if (data) {
        // If we are searching from a NEW location (not the default Munich one),
        // we must update the "Standard Travel Time" (distance) because the static JSON value 
        // (e.g. 60min from Munich) is irrelevant for Stuttgart.
        // For custom locations, Standard Time = Calculated Time (approx).

        const newStandardTime = isDefaultLocation ? resort.distance : data.duration;

        return {
          ...resort,
          distance: newStandardTime, // Update Standard Time if custom location
          traffic: {
            duration: data.duration, // Current Time (from API)
            distanceKm: data.distanceKm, // km
            loading: false
          }
        };
      }
      return {
        ...resort,
        traffic: null
      };
    });

    // 3. Recalculate scores (uses resort.distance from resorts.json, not traffic data)
    const scoredResorts = updatedResorts.map(resort => ({
      ...resort,
      score: calculateScore(resort)
    }));

    store.setState({ resorts: scoredResorts }, render);
    logToUI(`✅ Fahrzeiten für ${locationName} aktualisiert`);

  } catch (err) {
    console.error("Failed to load traffic data:", err);
    showError(`❌ Verkehrsdaten konnten nicht geladen werden: ${err.message}`);
    logToUI(`❌ Fehler beim Laden der Verkehrsdaten: ${err.message}`, "error");

    // Reset loading state on error
    const resetResorts = currentResorts.map(r => ({
      ...r,
      traffic: null
    }));
    store.setState({ resorts: resetResorts }, render);
  }
}

function render() {
  hideError();
  const state = store.get();
  const { viewMode, sortKey, filter, sortDirection } = state;

  // 1. Get processed data (filtered)
  // We still need to handle the specific "top3" logic if getProcessedResorts doesn't do it fully,
  // but let's rely on the store helper we created.
  let resortsToRender = store.getProcessedResorts();

  // Ensure scores are calculated if not present (handled in load/traffic, but safeguard)
  resortsToRender = resortsToRender.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : calculateScore(r)
  }));


  // 2. Update Map
  if (viewMode === "map") {
    document.getElementById("skiTable").style.display = "none";
    document.getElementById("map-view").style.display = "block";
    document.getElementById("map-view").style.visibility = "visible";

    initMap(resortsToRender);
    updateMap(resortsToRender);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);

  } else {
    // 3. Render Table
    document.getElementById("skiTable").style.display = "";
    document.getElementById("map-view").style.display = "none";

    renderTable(resortsToRender, sortKey, filter, sortDirection);
  }

  // Update sort indicators
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === sortKey) {
      th.classList.add(`sort-${sortDirection}`);
    }
  });
}

async function handleAddressSearch() {
  const query = document.getElementById("addressInput").value.trim();

  // Validation
  if (!query) {
    alert("⚠️ Bitte geben Sie einen Ort ein.\n\nBeispiele:\n• Augsburg\n• Rosenheim\n• Marienplatz 1, München");
    return;
  }

  if (query.length < 3) {
    showError("⚠️ Die Eingabe ist zu kurz. Bitte geben Sie mindestens 3 Zeichen ein.");
    return;
  }

  // Hide previous errors
  hideError();

  // Show loading state
  const btn = document.getElementById("searchBtn");
  const originalText = btn.textContent;
  btn.textContent = "⌛ Suche...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/traffic/geocode?q=${encodeURIComponent(query)}`);

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        throw new Error("NOT_FOUND");
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const location = await res.json();

    if (!location || !location.latitude || !location.longitude) {
      throw new Error("INVALID_RESPONSE");
    }

    await fetchTrafficForLocation(location.latitude, location.longitude, location.name);

    // Clear input on success
    document.getElementById("addressInput").value = "";

  } catch (err) {
    console.error("Geocoding error:", err);

    if (err.message === "NOT_FOUND") {
      alert("❌ Adresse nicht gefunden.\n\nTipps:\n• Versuchen Sie nur den Ortsnamen (z.B. \"Augsburg\")\n• Prüfen Sie die Schreibweise\n• Verwenden Sie bekannte Städte in Bayern\n\nBeispiele:\n• Rosenheim\n• Garmisch-Partenkirchen\n• Marienplatz, München");
    } else if (err.message === "INVALID_RESPONSE") {
      showError("❌ Ungültige Antwort vom Server. Bitte versuchen Sie es später erneut.");
    } else {
      alert("❌ Fehler bei der Ortssuche.\n\nMögliche Ursachen:\n• Backend nicht erreichbar\n• Netzwerkproblem\n• API-Limit erreicht\n\nBitte versuchen Sie es später erneut.");
    }
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function handleGeolocation() {
  if (!navigator.geolocation) {
    alert("❌ Geolocation wird von Ihrem Browser nicht unterstützt.");
    return;
  }

  const btn = document.getElementById("locateBtn");
  const originalText = btn.textContent;
  btn.textContent = "⌛ Ortung läuft...";
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      btn.textContent = originalText;
      btn.disabled = false;
      const { latitude, longitude } = position.coords;
      await fetchTrafficForLocation(latitude, longitude, "Ihr Standort");
    },
    (error) => {
      btn.textContent = originalText;
      btn.disabled = false;
      console.error("Geolocation error:", error);
      alert("❌ Standort konnte nicht ermittelt werden. Bitte erlauben Sie den Standortzugriff.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initial Load
  load();
  // Auto-refresh
  setInterval(load, 30 * 60 * 1000);

  // Search
  document.getElementById("searchBtn").addEventListener("click", handleAddressSearch);
  document.getElementById("locateBtn").addEventListener("click", handleGeolocation);
  document.getElementById("addressInput").addEventListener("keypress", (e) => {
    if (e.key === 'Enter') handleAddressSearch();
  });

  // Buttons
  document.getElementById("viewToggle").addEventListener("click", () => {
    const nextMode = store.get().viewMode === "list" ? "map" : "list";
    document.getElementById("viewToggle").textContent = nextMode === "list" ? "🗺️ Karte anzeigen" : "📋 Liste anzeigen";
    store.setState({ viewMode: nextMode }, render);
  });

  document.getElementById("top3").addEventListener("click", () => {
    const nextFilter = store.get().filter === "top3" ? "all" : "top3";
    document.getElementById("top3").textContent = nextFilter === "top3" ? "❌ Alle anzeigen" : "🏆 Nur Top-3 heute";
    store.setState({ filter: nextFilter }, render);
  });

  document.getElementById("exportCsv").addEventListener("click", exportToCsv);

  // Sort Headers
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const newSort = th.dataset.sort;
      const currentSort = store.get().sortKey;
      let sortDirection = store.get().sortDirection;

      // If clicking the same column, toggle direction
      if (currentSort === newSort) {
        sortDirection = sortDirection === "desc" ? "asc" : "desc";
      } else {
        // New column - set default direction based on column type
        // Distance and price should default to ascending (lower is better)
        // Score, pistes, snow should default to descending (higher is better)
        sortDirection = ['distance', 'distance_km', 'traffic_duration', 'price'].includes(newSort) ? "asc" : "desc";
      }

      store.setState({ sortKey: newSort, sortDirection }, render);
    });
  });

  // Mobile Sort Buttons
  document.querySelectorAll(".sort-mobile button").forEach(btn => {
    btn.addEventListener("click", () => {
      store.setState({ sortKey: btn.dataset.sort }, render);
    });
  });

  // Weather Modal Handlers
  const modal = document.getElementById("weatherModal");
  const closeBtn = document.querySelector(".close");

  // Close modal when clicking X
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle weather button clicks (delegated)
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("weather-btn")) {
      const resortId = event.target.dataset.resortId;
      const resortName = event.target.dataset.resortName;

      // Show modal
      modal.style.display = "block";
      document.getElementById("weatherResortName").textContent = `${resortName} - 3-Day Forecast`;
      document.getElementById("weatherForecast").innerHTML = "<p>Loading...</p>";

      try {
        const res = await fetch(`${API_BASE_URL}/api/weather/${resortId}`);
        if (!res.ok) throw new Error("Failed to fetch weather");

        const data = await res.json();
        displayWeather(data.forecast);
      } catch (error) {
        console.error("Weather error:", error);
        document.getElementById("weatherForecast").innerHTML = "<p>❌ Weather data unavailable</p>";
      }
    }
  });

  // Details Modal Handlers
  const detailsModal = document.getElementById("detailsModal");
  const closeDetailsBtn = document.querySelector(".close-details");

  closeDetailsBtn.addEventListener("click", () => {
    detailsModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === detailsModal) {
      detailsModal.style.display = "none";
    }
  });

  // Handle details button clicks
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("details-btn")) {
      const resortId = event.target.dataset.resortId;
      const resortName = event.target.dataset.resortName;

      // Find resort data
      const resort = store.get().resorts.find(r => r.id === resortId);

      if (!resort) {
        alert("Resort data not found");
        return;
      }

      // Show modal
      detailsModal.style.display = "block";
      document.getElementById("detailsResortName").textContent = `${resortName} - Details`;

      // Render details
      displayResortDetails(resort);
    }
  });

  // History Modal Handlers
  const historyModal = document.getElementById("historyModal");
  const closeHistoryBtn = document.querySelector(".close-history");

  closeHistoryBtn.addEventListener("click", () => {
    historyModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === historyModal) {
      historyModal.style.display = "none";
    }
  });

  // History Modal Tab Switching
  // History Modal Tab Switching
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      const tab = e.target.dataset.tab;
      switchHistoryTab(tab);
    }
  });

  // Handle history button clicks
  let currentResortId = null;

  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("history-btn")) {
      const resortId = event.target.dataset.resortId;
      const resortName = event.target.dataset.resortName;
      currentResortId = resortId;

      // Update Traffic History State
      currentResortIdForTraffic = resortId;
      currentTrafficChartLoaded = false;

      // Reset to Lifts tab
      switchHistoryTab('lifts');

      historyModal.style.display = "block";
      document.getElementById("historyResortName").textContent = `${resortName} - History`;

      try {
        const res = await fetch(`${API_BASE_URL}/api/history/${resortId}?days=7`);
        if (!res.ok) throw new Error("Failed to fetch history");

        const data = await res.json();
        displayHistoryChart(data.history);
      } catch (error) {
        console.error("History error:", error);
        alert("History data not available yet. Data is collected daily.");
      }
    }
  });

  // CSV Export button handler
  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    if (currentResortId) {
      const days = 30; // Export 30 days by default
      window.location.href = `${API_BASE_URL}/api/export/${currentResortId}?days=${days}`;
    }
  });

  // Status Modal Handlers
  const statusModal = document.getElementById("statusModal");
  const closeStatusBtn = document.querySelector(".close-status");

  document.getElementById("openStatusBtn").addEventListener("click", (e) => {
    e.preventDefault();
    statusModal.style.display = "block";
    fetchSystemStatus();
    // Start auto-refresh for status
    if (!window.statusInterval) {
      window.statusInterval = setInterval(fetchSystemStatus, 5000);
    }
  });

  closeStatusBtn.addEventListener("click", () => {
    statusModal.style.display = "none";
    if (window.statusInterval) {
      clearInterval(window.statusInterval);
      window.statusInterval = null;
    }
  });

  window.addEventListener("click", (event) => {
    if (event.target === statusModal) {
      statusModal.style.display = "none";
      if (window.statusInterval) {
        clearInterval(window.statusInterval);
        window.statusInterval = null;
      }
    }
  });
});

async function fetchSystemStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/status`);
    if (!res.ok) throw new Error("Status API failed");
    const data = await res.json();
    renderStatusDashboard(data);
  } catch (err) {
    console.error("Status error:", err);
  }
}

function renderStatusDashboard(data) {
  // Database
  const dbEl = document.getElementById("statusDb");
  const dbOk = data.database?.connected;
  dbEl.textContent = dbOk ? "🟢 Online" : "🔴 Offline";
  dbEl.style.color = dbOk ? "green" : "red";
  if (!dbOk) dbEl.title = data.database?.message || "Unknown error";

  // Uptime
  const uptime = Math.floor(data.uptime || 0);
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  document.getElementById("statusUptime").textContent = `${hours}h ${mins}m`;

  // Logs
  const logContainer = document.getElementById("systemLogs");
  if (data.logs && data.logs.length > 0) {
    logContainer.innerHTML = data.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      let color = "#333";
      if (log.level === 'error') color = "#d32f2f";
      if (log.level === 'warn') color = "#f57c00";
      if (log.level === 'success') color = "#43a047";

      let icon = "ℹ️";
      if (log.level === 'error') icon = "❌";
      if (log.level === 'warn') icon = "⚠️";
      if (log.level === 'success') icon = "✅";

      return `<div class="log-entry" style="border-bottom: 1px solid #eee; padding: 4px 0; font-family: monospace; font-size: 0.9em; color: ${color};">
        <span style="color: #999;">[${time}]</span> ${icon} <strong>[${log.component.toUpperCase()}]</strong> ${log.message}
      </div>`;
    }).join("");
  } else {
    logContainer.innerHTML = "<div class='log-entry'>No logs available</div>";
  }
}

let historyChart = null;

function displayHistoryChart(history) {
  const ctx = document.getElementById("historyChart");

  if (!history || history.length === 0) {
    ctx.parentElement.innerHTML = "<p>No historical data available yet. Data is collected daily starting from today.</p>";
    return;
  }

  // Destroy previous chart if exists
  if (historyChart) {
    historyChart.destroy();
  }

  const dates = history.map(h => {
    const date = new Date(h.date);
    return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  });

  const snowData = history.map(h => parseInt(h.snow) || null);
  const liftsData = history.map(h => h.liftsOpen || null);

  historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Snow Depth (cm)',
          data: snowData,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          yAxisID: 'y',
          tension: 0.3
        },
        {
          label: 'Lifts Open',
          data: liftsData,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Snow Depth (cm)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Lifts Open'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      }
    }
  });
}

// -- TRAFFIC HISTORY CHART --
let currentResortIdForTraffic = null;
let currentTrafficChartLoaded = false;

async function switchHistoryTab(tab) {
  // Toggle active classes
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.history-tabs [data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle content visibility
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const targetContent = document.getElementById(`${tab}Tab`);
  if (targetContent) targetContent.style.display = 'block';

  // Load content
  if (tab === 'traffic' && !currentTrafficChartLoaded && currentResortId) {
    loadResortTrafficHistory(currentResortId);
  } else if (tab === 'weather' && currentResortId) {
    const { createCombinedWeatherChart } = await import('./weatherChart.js');
    createCombinedWeatherChart("weatherChartsContainer", currentResortId, 30);
  }
}

// Find nearest city based on user location
function findNearestCity(lat, lon) {
  const cities = [
    { id: 'munich', lat: 48.1351, lon: 11.5820 },
    { id: 'augsburg', lat: 48.3705, lon: 10.8978 },
    { id: 'salzburg', lat: 47.8095, lon: 13.0550 }
  ];

  let nearest = cities[0];
  let minDist = Infinity;

  cities.forEach(city => {
    const dist = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  });

  return nearest.id;
}

// Load resort-specific traffic history
async function loadResortTrafficHistory(resortId) {
  // Determine nearest city based on user location
  const userLat = window.userLocation?.latitude || 48.1351; // Munich default
  const userLon = window.userLocation?.longitude || 11.5820;

  const nearestCity = findNearestCity(userLat, userLon);

  try {
    const res = await fetch(`${API_BASE_URL}/api/history/traffic/${nearestCity}/${resortId}`);
    if (!res.ok) throw new Error('Failed to fetch traffic history');

    const response = await res.json();
    renderResortTrafficChart(response.data, resortId, nearestCity);
    currentTrafficChartLoaded = true;
  } catch (error) {
    console.error('Traffic history error:', error);
    const ctx = document.getElementById('trafficHistoryChart');
    if (ctx) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      // Show error message
    }
  }
}

// Render resort-specific traffic chart (weekly bar chart)
let resortTrafficChartInstance = null;

function renderResortTrafficChart(data, resortId, cityId) {
  const ctx = document.getElementById('trafficHistoryChart');

  if (resortTrafficChartInstance) {
    resortTrafficChartInstance.destroy();
  }

  if (!data || data.length === 0) {
    console.log('No traffic data available for', resortId);
    return;
  }

  // Aggregate data by day-of-week and hour
  const weeklyData = aggregateWeeklyTraffic(data);
  const labels = generateWeekLabels();

  resortTrafficChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Ø Verzögerung ab ${getCityName(cityId)} (min)`,
        data: weeklyData,
        backgroundColor: weeklyData.map(delay => getTrafficColor(delay)),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Verzögerung (Minuten)' }
        },
        x: {
          title: { display: true, text: 'Wochentag / Uhrzeit' },
          ticks: {
            maxRotation: 90,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20
          }
        }
      }
    }
  });
}

// Aggregate traffic data by day-of-week and hour
function aggregateWeeklyTraffic(data) {
  // Group by day-of-week (0-6) and hour (0-23)
  const grid = Array(7).fill(null).map(() => Array(24).fill(null).map(() => []));

  data.forEach(entry => {
    const date = new Date(entry.timestamp);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const hour = date.getHours();
    const adjustedDay = day === 0 ? 6 : day - 1; // Convert to Mo=0, So=6

    grid[adjustedDay][hour].push(entry.delay);
  });

  // Calculate averages and flatten to 168 values
  const weeklyData = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const delays = grid[day][hour];
      const avg = delays.length > 0
        ? delays.reduce((sum, d) => sum + d, 0) / delays.length
        : 0;
      weeklyData.push(Math.round(avg));
    }
  }

  return weeklyData;
}

// Generate week labels (Mo 00:00 - So 23:00)
function generateWeekLabels() {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const labels = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      labels.push(`${days[day]} ${hour.toString().padStart(2, '0')}:00`);
    }
  }

  return labels;
}

// Get traffic color based on delay
function getTrafficColor(delay) {
  if (delay > 20) return 'rgba(231, 76, 60, 0.8)'; // Red
  if (delay > 10) return 'rgba(243, 156, 18, 0.8)'; // Orange
  if (delay > 5) return 'rgba(241, 196, 15, 0.8)'; // Yellow
  return 'rgba(46, 204, 113, 0.8)'; // Green
}

// Helper to get city name
function getCityName(cityId) {
  const cityNames = {
    'munich': 'München',
    'augsburg': 'Augsburg',
    'salzburg': 'Salzburg'
  };
  return map[id] || id;
}

function displayWeather(forecast) {
  // ...
  const container = document.getElementById("weatherForecast");

  if (!forecast || forecast.length === 0) {
    container.innerHTML = "<p>No forecast data available</p>";
    return;
  }

  const html = forecast.map(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

    return `
      <div class="weather-day">
        <div class="date">${dayName}</div>
        <div class="emoji">${day.weatherEmoji}</div>
        <div class="desc">${day.weatherDesc}</div>
        <div class="temp">
          <span class="temp-max">${day.tempMax}°</span> /
          <span class="temp-min">${day.tempMin}°</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function displayResortDetails(resort) {
  const container = document.getElementById("detailsContent");
  const safeResortName = escapeHtml(resort.name);

  // Show loading state
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Lade Details für ${safeResortName}...</p>
    </div>
  `;

  // Small delay to show loading state
  setTimeout(() => {
    if (!resort.lifts && !resort.slopes) {
      container.innerHTML = "<p>Keine detaillierten Daten verfügbar</p>";
      return;
    }

    let html = "";

    // Historical Chart Section
    html += `<div class="details-section">
      <h3>📊 7-Tage Verlauf</h3>
      <canvas id="detailsHistoryChart" style="max-height: 200px;"></canvas>
      <p id="detailsHistoryStatus" style="text-align: center; color: #666; font-size: 0.9em;">Lade Verlaufsdaten...</p>
    </div>`;

    // Lifts Section
    if (resort.lifts && resort.lifts.length > 0) {
      html += `<div class="details-section">
      <h3>🚡 Lifte (${resort.liftsOpen || 0}/${resort.liftsTotal || resort.lifts.length})</h3>
      <div class="facilities-list">`;

      resort.lifts.forEach(lift => {
        const statusClass = lift.status === "open" ? "status-open" :
          lift.status === "closed" ? "status-closed" : "status-unknown";
        const statusIcon = lift.status === "open" ? "🟢" :
          lift.status === "closed" ? "🔴" : "⚪";

        const safeLiftName = escapeHtml(lift.name);

        html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          <span class="facility-name">${safeLiftName}</span>
        </div>`;

        // Metadata
        const metadata = [];
        if (lift.type) metadata.push(`Typ: ${escapeHtml(lift.type)}`);
        if (lift.length) metadata.push(`Länge: ${lift.length}m`); // Number, safe
        if (lift.altitudeStart) metadata.push(`Höhe: ${lift.altitudeStart}m`); // Number, safe
        if (lift.operatingHours) metadata.push(`⏰ ${escapeHtml(lift.operatingHours)}`);

        if (metadata.length > 0) {
          html += `<div class="facility-meta">${metadata.join(' • ')}</div>`;
        }

        html += `</div>`;
      });

      html += `</div></div>`;
    }

    // Slopes Section
    if (resort.slopes && resort.slopes.length > 0) {
      const slopesOpen = resort.slopes.filter(s => s.status === "open").length;
      html += `<div class="details-section">
      <h3>⛷️ Pisten (${slopesOpen}/${resort.slopes.length})</h3>
      <div class="facilities-list">`;

      resort.slopes.forEach(slope => {
        const statusClass = slope.status === "open" ? "status-open" :
          slope.status === "closed" ? "status-closed" : "status-unknown";
        const statusIcon = slope.status === "open" ? "🟢" :
          slope.status === "closed" ? "🔴" : "⚪";

        const difficultyIcon = slope.difficulty === "blue" ? "🔵" :
          slope.difficulty === "red" ? "🔴" :
            slope.difficulty === "black" ? "⚫" :
              slope.difficulty === "freeride" ? "🟠" : "";

        const safeSlopeName = escapeHtml(slope.name);

        html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          ${difficultyIcon ? `<span class="difficulty-badge">${difficultyIcon}</span>` : ''}
          <span class="facility-name">${safeSlopeName}</span>
        </div>`;

        // Metadata
        const metadata = [];
        if (slope.difficulty) metadata.push(`Schwierigkeit: ${escapeHtml(slope.difficulty)}`);
        if (slope.length) metadata.push(`Länge: ${slope.length}m`);
        if (slope.altitudeStart) metadata.push(`Höhe: ${slope.altitudeStart}m`);
        if (slope.operatingHours) metadata.push(`⏰ ${escapeHtml(slope.operatingHours)}`);

        if (metadata.length > 0) {
          html += `<div class="facility-meta">${metadata.join(' • ')}</div>`;
        }

        html += `</div>`;
      });

      html += `</div></div>`;
    }

    container.innerHTML = html;

    // Fetch and render historical data
    fetchDetailsHistory(resort.id);
  }, 100);
}

let detailsHistoryChart = null;

async function fetchDetailsHistory(resortId) {
  const statusEl = document.getElementById("detailsHistoryStatus");

  try {
    const res = await fetch(`${API_BASE_URL}/api/history/${resortId}?days=7`);
    if (!res.ok) throw new Error("Failed to fetch history");

    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      statusEl.textContent = "Keine Verlaufsdaten verfügbar (Daten werden täglich gesammelt)";
      return;
    }

    // Destroy previous chart
    if (detailsHistoryChart) {
      detailsHistoryChart.destroy();
    }

    const ctx = document.getElementById("detailsHistoryChart");
    const dates = data.history.map(h => {
      const date = new Date(h.date);
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    });

    const liftsData = data.history.map(h => h.liftsOpen || null);

    detailsHistoryChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Geöffnete Lifte',
          data: liftsData,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    statusEl.style.display = "none";
  } catch (error) {
    console.error("History error:", error);
    statusEl.textContent = "Verlaufsdaten noch nicht verfügbar";
  }
}
