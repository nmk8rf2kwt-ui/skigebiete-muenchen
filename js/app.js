import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap } from "./map.js";
import { API_BASE_URL } from "./config.js";

// State
let allResorts = [];
let currentSort = "score";
let currentFilter = "all";
let viewMode = "list"; // 'list' or 'map'

// Load Data
async function load() {
  // 1. Fetch Static Data Fast
  try {
    const staticRes = await fetch(`${API_BASE_URL}/resorts/static`);
    if (!staticRes.ok) throw new Error(`HTTP ${staticRes.status}`);
    const staticData = await staticRes.json();

    // Enrich with Score immediately
    allResorts = staticData.map(r => ({
      ...r,
      score: calculateScore(r)
    }));

    render();
  } catch (err) {
    console.error("Failed to load static data:", err);
    alert("❌ Fehler beim Laden der Daten. Bitte Backend überprüfen.");
  }

  // 2. Fetch Live Data
  try {
    const liveRes = await fetch(`${API_BASE_URL}/resorts`);
    if (!liveRes.ok) throw new Error(`HTTP ${liveRes.status}`);
    const liveData = await liveRes.json();

    // Enrich
    allResorts = liveData.map(r => ({
      ...r,
      score: calculateScore(r)
    }));

    render();

    // Update timestamp
    const ts = document.getElementById("timestamp");
    if (ts) ts.innerText = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Failed to load live data:", err);
  }
}

// Render Wrapper
function render() {
  if (viewMode === 'list') {
    document.getElementById("skiTable").style.display = "";
    document.getElementById("map-view").style.display = "none";
    renderTable(allResorts, currentSort, currentFilter);
  } else {
    document.getElementById("skiTable").style.display = "none";
    document.getElementById("map-view").style.display = "block";

    // Get filtered resorts (same logic as renderTable)
    let filteredResorts = allResorts.map(r => ({
      ...r,
      score: r.score !== undefined ? r.score : calculateScore(r)
    }));

    if (currentFilter === 'top3') {
      filteredResorts.sort((a, b) => b.score - a.score);
      filteredResorts = filteredResorts.slice(0, 3);
    } else if (currentFilter === 'open') {
      filteredResorts = filteredResorts.filter(r => r.liftsOpen > 0);
    }

    // Initialize map if needed, or just update
    initMap(filteredResorts);
    updateMap(filteredResorts);

    // Leaflet needs a resize trigger when becoming visible
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
}

// Export CSV
function exportToCsv() {
  if (!allResorts.length) return;

  const headers = ["Name", "Reisezeit (min)", "Pisten (km)", "Lifte (Offen/Total)", "Preis (€)", "Typ", "Schnee", "Wetter", "Score"];
  const rows = allResorts.map(r => {
    // Re-calculate or use raw data. Note: renderTable calculates score but doesn't persist it to allResorts unless we mutate.
    // Ideally renderTable should return the enriched data or we enrich first.
    // For simplicity, let's just grab raw props.

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
      r.score || 0 // This might be missing if we calculate it only in renderTable
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

// Munich Marienplatz coordinates (default)
const MUNICH_DEFAULT = {
  latitude: 48.1351,
  longitude: 11.5820,
  name: "München Innenstadt"
};

async function fetchTrafficForLocation(lat, lon, locationName = "custom location") {
  try {
    const res = await fetch(`${API_BASE_URL}/traffic/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon })
    });

    if (!res.ok) throw new Error("Traffic fetch failed");

    const trafficData = await res.json();

    // Merge into allResorts
    allResorts = allResorts.map(resort => {
      const t = trafficData[resort.id];
      if (t) {
        return {
          ...resort,
          distance: t.duration,
          traffic: t
        };
      }
      return resort;
    });

    render();

    // Only show alert if not default Munich
    if (locationName !== MUNICH_DEFAULT.name) {
      alert(`✅ Fahrzeiten aktualisiert von: ${locationName}`);
    }

  } catch (err) {
    console.error(err);
    alert("❌ Fehler beim Berechnen der Fahrzeiten.");
  }
}

// Show error message in UI instead of alert
function showError(message) {
  const errorDiv = document.getElementById("searchError");
  errorDiv.innerHTML = message.replace(/\n/g, '<br>');
  errorDiv.style.display = "block";

  // Auto-hide after 8 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 8000);
}

// Hide error message
function hideError() {
  const errorDiv = document.getElementById("searchError");
  errorDiv.style.display = "none";
}

async function handleAddressSearch() {
  const query = document.getElementById("addressInput").value.trim();

  // Validation
  if (!query) {
    alert("⚠️ Bitte geben Sie einen Ort ein.\n\nBeispiele:\n• Augsburg\n• Rosenheim\n• Marienplatz 1, München");
    return;
  }

  if (query.length < 3) {
    alert("⚠️ Die Eingabe ist zu kurz. Bitte geben Sie mindestens 3 Zeichen ein.");
    return;
  }

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
      alert("❌ Ungültige Antwort vom Server. Bitte versuchen Sie es später erneut.");
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
      currentSort = th.dataset.sort;
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
