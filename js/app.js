import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap } from "./map.js";
import { API_BASE_URL } from "./config.js";
import { store } from "./store.js";

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

function logToUI(msg) {
  const container = document.getElementById("searchError");
  const content = document.getElementById("errorContent");
  if (!container || !content) return;

  // Only show if it's already visible, or if we want logs to pop up (optional)
  // For now, let's keep it visible if logs happen
  container.style.display = "block";

  const line = document.createElement("div");
  line.style.borderBottom = "1px solid #eee";
  line.style.padding = "2px 0";
  line.style.fontSize = "0.85em";
  line.style.color = "#555";
  line.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
  content.appendChild(line);

  // Auto-scroll to bottom
  content.scrollTop = content.scrollHeight;
}

// Hide error message
function hideError() {
  // Disable auto-hide for debugging
}

// Load Data
async function load() {
  logToUI("🚀 Starting load()...");

  // 1. Fetch Static Data Fast
  try {
    logToUI(`Fetching static from: ${API_BASE_URL}/resorts/static`);
    const staticRes = await fetch(`${API_BASE_URL}/resorts/static`);

    if (!staticRes.ok) throw new Error(`HTTP ${staticRes.status}`);
    const staticData = await staticRes.json();
    logToUI(`✅ Loaded ${staticData.length} static resorts`);

    store.setState({ resorts: staticData }, render);
  } catch (err) {
    console.error("Failed to load static data:", err);
    showError(`❌ Static Load Error: ${err.message}`);
  }

  // 2. Fetch Live Data
  try {
    logToUI("Fetching live data...");
    const liveRes = await fetch(`${API_BASE_URL}/resorts`);
    if (!liveRes.ok) throw new Error(`HTTP ${liveRes.status}`);
    const liveData = await liveRes.json();
    logToUI(`✅ Loaded ${liveData.length} live resorts`);

    store.setState({ resorts: liveData, lastUpdated: new Date() }, render);

    // Update timestamp
    const ts = document.getElementById("timestamp");
    if (ts) ts.innerText = new Date().toLocaleTimeString();

    // 3. Calculate initial traffic/distance from Munich
    await fetchTrafficForLocation(MUNICH_DEFAULT.latitude, MUNICH_DEFAULT.longitude, MUNICH_DEFAULT.name);

  } catch (err) {
    console.error("Failed to load live data:", err);
    showError(`❌ Live Load Error: ${err.message}`);
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
  logToUI(`Fetching traffic for ${locationName} (${lat}, ${lon})...`);
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

    // Convert object map back to array for frontend logic
    // Old implementation expected array of objects { resortId, distance, duration, trafficAlert }
    // New /calculate returns { resortId: { duration, distance } }

    const trafficData = Object.entries(trafficMap).map(([id, data]) => ({
      resortId: id,
      duration: data.duration * 60, // backend returns minutes, frontend logic below expects seconds?
      // Wait, backend traffic.js line 88 says: duration: Math.round(durationSeconds / 60) // minutes
      // So backend returns minutes.
      // Frontend line 145 says: duration: Math.round(trafficInfo.duration / 60)
      // So frontend expects seconds.
      // Let's ADJUST here to match frontend expectation or adjust frontend logic.
      // Easiest is to provide what frontend expects (seconds) so line 145 works.
      durationSeconds: data.duration * 60,
      distance: data.distance * 1000 // backend km -> frontend meters
    }));

    logToUI(`✅ Loaded traffic data for ${locationName}`);

    // Update resorts with distance and duration
    const currentResorts = store.get().resorts;
    const updatedResorts = currentResorts.map(resort => {
      const trafficInfo = trafficData.find(t => t.resortId === resort.id);
      if (trafficInfo) {
        return {
          ...resort,
          distance: Math.round(trafficInfo.distance / 1000), // m -> km
          duration: Math.round(trafficInfo.durationSeconds / 60), // s -> min
          trafficAlert: null // trafficInfo.trafficAlert || null
        };
      }
      return resort;
    });

    // Recalculate scores
    const scoredResorts = updatedResorts.map(resort => ({
      ...resort,
      score: calculateScore(resort)
    }));

    store.setState({ resorts: scoredResorts }, render);
  } catch (err) {
    console.error("Failed to load traffic data:", err);
    showError(`❌ Traffic Load Error for ${locationName}: ${err.message}`);
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
        sortDirection = ['distance', 'price'].includes(newSort) ? "asc" : "desc";
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

  // Initial Load
  load();
  // Auto-refresh
  setInterval(load, 30 * 60 * 1000);

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

  // Handle history button clicks
  let currentResortId = null;

  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("history-btn")) {
      const resortId = event.target.dataset.resortId;
      const resortName = event.target.dataset.resortName;
      currentResortId = resortId;

      historyModal.style.display = "block";
      document.getElementById("historyResortName").textContent = `${resortName} - 7-Day History`;

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
});

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

function displayWeather(forecast) {
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

  // Show loading state
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Lade Details für ${resort.name}...</p>
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

      html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          <span class="facility-name">${lift.name}</span>
        </div>`;

      // Metadata
      const metadata = [];
      if (lift.type) metadata.push(`Typ: ${lift.type}`);
      if (lift.length) metadata.push(`Länge: ${lift.length}m`);
      if (lift.altitudeStart) metadata.push(`Höhe: ${lift.altitudeStart}m`);
      if (lift.operatingHours) metadata.push(`⏰ ${lift.operatingHours}`);

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

      html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          ${difficultyIcon ? `<span class="difficulty-badge">${difficultyIcon}</span>` : ''}
          <span class="facility-name">${slope.name}</span>
        </div>`;

      // Metadata
      const metadata = [];
      if (slope.difficulty) metadata.push(`Schwierigkeit: ${slope.difficulty}`);
      if (slope.length) metadata.push(`Länge: ${slope.length}m`);
      if (slope.altitudeStart) metadata.push(`Höhe: ${slope.altitudeStart}m`);
      if (slope.operatingHours) metadata.push(`⏰ ${slope.operatingHours}`);

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
