import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap } from "./map.js";
import { API_BASE_URL } from "./config.js";

// State
let allResorts = [];
let currentSort = "score";
let currentFilter = "all";
let viewMode = "list"; // 'list' or 'map'
let sortDirection = "desc"; // 'asc' or 'desc'

// Global Error Handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorDiv = document.getElementById("searchError");
  if (errorDiv) {
    errorDiv.style.display = "block";
    errorDiv.innerHTML = `❌ Global Error:<br>${msg}<br>Line: ${lineNo}<br>File: ${url}`;
  }
  return false;
};

// Munich Marienplatz coordinates (default)
const MUNICH_DEFAULT = {
  latitude: 48.1351,
  longitude: 11.5820,
  name: "München Innenstadt"
};

// Show message in UI (persistent for debugging)
function showError(message) {
  const errorDiv = document.getElementById("searchError");
  if (!errorDiv) return;
  errorDiv.style.display = "block";
  // Append instead of replace to see history
  errorDiv.innerHTML += `<div>${message}</div>`;
}

function logToUI(msg) {
  const errorDiv = document.getElementById("searchError");
  if (!errorDiv) return;
  errorDiv.style.display = "block";
  errorDiv.style.color = "#333"; // Use dark text for logs
  errorDiv.innerHTML += `<div style="border-bottom: 1px solid #ddd; padding: 2px;">${new Date().toLocaleTimeString()}: ${msg}</div>`;
}

// Hide error message
function hideError() {
  // Disable auto-hide for debugging
  // const errorDiv = document.getElementById("searchError");
  // errorDiv.style.display = "none";
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

    // Store data (score will be calculated in renderTable if needed)
    allResorts = staticData;
    render();
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

    // Store data (score will be calculated in renderTable if needed)
    allResorts = liveData;
    render();

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
    const res = await fetch(`${API_BASE_URL}/traffic?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const trafficData = await res.json();
    logToUI(`✅ Loaded traffic data for ${locationName}`);

    // Update allResorts with distance and duration
    allResorts = allResorts.map(resort => {
      const trafficInfo = trafficData.find(t => t.resortId === resort.id);
      if (trafficInfo) {
        return {
          ...resort,
          distance: Math.round(trafficInfo.distance / 1000), // km
          duration: Math.round(trafficInfo.duration / 60), // minutes
          trafficAlert: trafficInfo.trafficAlert || null
        };
      }
      return resort;
    });

    // Recalculate scores and re-render
    allResorts = allResorts.map(resort => ({
      ...resort,
      score: calculateScore(resort)
    }));

    render();
  } catch (err) {
    console.error("Failed to load traffic data:", err);
    showError(`❌ Traffic Load Error for ${locationName}: ${err.message}`);
  }
}

function render() {
  hideError(); // Hide any previous errors before rendering

  // 1. Filter resorts (Logic shared for Map and Table)
  let resortsToRender = [...allResorts];

  // Calculate scores if needed (renderTable does this too, but we need it for top3 filter here)
  resortsToRender = resortsToRender.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : calculateScore(r)
  }));

  if (currentFilter === "top3") {
    resortsToRender.sort((a, b) => (b.score || 0) - (a.score || 0));
    resortsToRender = resortsToRender.slice(0, 3);
  } else if (currentFilter === "open") {
    // Future feature: Filter by open lifts if needed
    resortsToRender = resortsToRender.filter(r => r.liftsOpen > 0);
  }

  // 2. Update Map (Needs filtered data, but order doesn't matter)
  if (viewMode === "map") {
    document.getElementById("skiTable").style.display = "none";
    document.getElementById("map-view").style.display = "block";
    // Leaflet needs to be visible to size correctly
    document.getElementById("map-view").style.visibility = "visible";

    initMap(resortsToRender);
    updateMap(resortsToRender);

    // Trigger resize to fix any grey tiles
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);

  } else {
    // 3. Render Table (Needs filtered data + Sort options)
    // We pass 'all' as filter because we already filtered resortsToRender above
    document.getElementById("skiTable").style.display = "";
    document.getElementById("map-view").style.display = "none";

    renderTable(resortsToRender, currentSort, 'all', sortDirection);
  }

  // Update sort indicators
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === currentSort) {
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
    viewMode = viewMode === "list" ? "map" : "list";
    document.getElementById("viewToggle").textContent = viewMode === "list" ? "🗺️ Karte anzeigen" : "📋 Liste anzeigen";
    render();
  });

  document.getElementById("top3").addEventListener("click", () => {
    currentFilter = currentFilter === "top3" ? "all" : "top3";
    document.getElementById("top3").textContent = currentFilter === "top3" ? "❌ Alle anzeigen" : "🏆 Nur Top-3 heute";
    render();
  });

  document.getElementById("exportCsv").addEventListener("click", exportToCsv);

  // Sort Headers
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const newSort = th.dataset.sort;

      // If clicking the same column, toggle direction
      if (currentSort === newSort) {
        sortDirection = sortDirection === "desc" ? "asc" : "desc";
      } else {
        // New column - set default direction based on column type
        currentSort = newSort;
        // Distance and price should default to ascending (lower is better)
        // Score, pistes, snow should default to descending (higher is better)
        sortDirection = ['distance', 'price'].includes(newSort) ? "asc" : "desc";
      }

      render();
    });
  });

  // Mobile Sort Buttons
  document.querySelectorAll(".sort-mobile button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentSort = btn.dataset.sort;
      render();
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
