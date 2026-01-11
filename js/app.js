import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap, showUserLocation } from "./map.js";
import { API_BASE_URL } from "./config.js";
import { store } from "./store.js";
import { escapeHtml, getDistanceFromLatLonInKm } from "./utils.js";
import { initEventListeners } from "./events.js";
import { DOMAIN_CONFIGS } from "./domainConfigs.js";

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

// Global State
let currentSearchLocation = { ...MUNICH_DEFAULT }; // Initialize with default
window.userLocation = currentSearchLocation; // Sync for other modules

// Exports for events.js
export const getCurrentSearchLocation = () => currentSearchLocation;

export const setCurrentSearchLocation = (loc) => {
  currentSearchLocation = loc;
  window.userLocation = loc; // Sync
};

// Show message in UI (persistent for debugging)
export function showError(message) {
  const container = document.getElementById("searchError");
  const content = document.getElementById("errorContent");
  if (!container || !content) return;

  const time = new Date().toLocaleTimeString();
  const entry = `<div class="error-entry">
    <span style="color: #999;">[${time}]</span> ${message}
  </div>`;

  content.innerHTML = entry + content.innerHTML;
  container.style.display = "block";
}

export function logToUI(msg, type = "info") {
  const container = document.getElementById("statusConsole");
  const content = document.getElementById("statusContent");
  if (!container || !content) return;

  const time = new Date().toLocaleTimeString();
  const icon = type === "success" ? "✅" : (type === "error" ? "❌" : "ℹ️");
  const entry = `<div class="status-entry" style="border-left: 3px solid ${type === "success" ? "#2ecc71" : (type === "error" ? "#e74c3c" : "#3498db")}">
    <span class="status-time">[${time}]</span> ${icon} ${msg}
  </div>`;

  content.innerHTML = entry + content.innerHTML;
}

export function showLoading(msg = "Lade Daten...") {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.querySelector(".loader-text").innerText = msg;
    loader.style.display = "flex";
  }
}

export function hideLoading() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

/**
 * Core Logic: Fetch Resorts & Transform Data
 */
async function load() {
  showLoading();
  try {
    const domainId = store.get().currentDomain || 'ski';
    const config = DOMAIN_CONFIGS[domainId];
    const endpoint = config?.endpoint || '/api/resorts';

    // Timeout logic for load
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("API-Verbindung fehlgeschlagen");
    const resorts = await response.json();
    console.group("🔍 DIAGNOSTIC: Data Load");
    console.log(`[API] Raw count: ${resorts ? resorts.length : 0}`);

    if (!resorts || resorts.length === 0) {
      console.warn("⚠️ API returned empty array!");
      console.groupEnd();
      return;
    }

    // Enrich with distance and scoring
    const enhancedResorts = resorts.map(resort => {
      const dist = getDistanceFromLatLonInKm(
        currentSearchLocation.latitude,
        currentSearchLocation.longitude,
        resort.latitude,
        resort.longitude
      );

      // Score remains ski-specific for now if it uses lifts, otherwise generalize
      const smartScore = calculateScore(resort, store.get().preference, domainId);

      if (isNaN(smartScore)) {
        console.warn(`⚠️ NaN Score for ${resort.name}`, resort);
      }

      return {
        ...resort,
        domain: domainId,
        distance_km: Math.round(dist),
        smartScore
      };
    });

    console.log(`[Enriched] Count: ${enhancedResorts.length}`, enhancedResorts[0]);
    console.groupEnd();

    store.setState({ resorts: enhancedResorts }, render);
    logToUI(`Daten für ${enhancedResorts.length} Ziele geladen`, "success");
  } catch (err) {
    console.error("❌ LOAD ERROR:", err);
    showError(`Daten-Ladefehler: ${err.message}`);
    logToUI(err.message, "error");
  } finally {
    hideLoading();
  }
}

/**
 * Global render trigger
 */
function render() {
  const { resorts, viewMode, currentDomain } = store.get();
  console.group("🎨 DIAGNOSTIC: Render Phase");
  console.log(`State: Mode=${viewMode}, Domain=${currentDomain}, Resorts=${resorts?.length}`);

  if (!resorts || !resorts.length) {
    console.warn("⚠️ Render called with empty resorts!");
    console.groupEnd();
    return;
  }

  const resultsGrid = document.getElementById("top3Cards");
  const tableView = document.getElementById("tableView");
  const mapView = document.getElementById("map-view");

  // Filter and Sort based on current UI state
  const sortedResorts = [...resorts].sort((a, b) => b.smartScore - a.smartScore);
  console.log(`Top Resort: ${sortedResorts[0].name} (Score: ${sortedResorts[0].smartScore})`);

  if (viewMode === 'top3') {
    console.log("👉 Delegating to renderTop3Cards");
    import("./render.js").then(module => module.renderTop3Cards(sortedResorts.slice(0, 3)));
  } else if (viewMode === 'table') {
    console.log("👉 Delegating to renderTable");
    renderTable(sortedResorts, undefined, 'all');
  } else if (viewMode === 'map') {
    updateMap(sortedResorts);
  }

  console.groupEnd();

  // Update Map anyway if it's initialized
  updateMap(sortedResorts);
}

/**
 * Geocoding & Search Logic
 */
async function handleAddressSearch() {
  const address = document.getElementById("addressInput").value;
  if (address.length < 3) return false;

  showLoading(`Suche "${address}"...`);
  try {
    // 3 Second Timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.features?.length > 0) {
      const feat = data.features[0];
      const name = feat.properties.city || feat.properties.name || address;
      const [lon, lat] = feat.geometry.coordinates;

      setCurrentSearchLocation({ latitude: lat, longitude: lon, name });
      logToUI(`Standort erkannt: ${name}`, "success");

      // Auto-load after location fix
      await fetchTrafficForLocation(lat, lon, name);
      return true;
    } else {
      showError("Standort nicht gefunden. Bitte versuche es genauer.");
      return false;
    }
  } catch (err) {
    showError(`Such-Fehler: ${err.message}`);
    return false;
  } finally {
    hideLoading();
  }
}

/**
 * Traffic API Proxy
 */
async function fetchTrafficForLocation(lat, lon, name) {
  try {
    showLoading(`Berechne Fahrzeiten von ${name}...`);
    const response = await fetch(`${API_BASE_URL}/api/traffic-all?lat=${lat}&lon=${lon}`);
    if (!response.ok) throw new Error("Verkehrsdaten-Fehler");

    // We update results silently in background
    await load();
  } catch (err) {
    console.warn("Traffic error:", err);
    logToUI("Fahrzeiten vorerst geschätzt (Traffic API Limit)", "info");
    await load();
  }
}

/**
 * Geolocation Handler
 */
export async function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser");
    return;
  }

  showLoading("Ermittle Standort...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setCurrentSearchLocation({ latitude, longitude, name: "Ihre aktuelle Position" });
      logToUI("Eigener Standort gefunden", "success");
      fetchTrafficForLocation(latitude, longitude, "Ihre Position");
    },
    (err) => {
      showError(`Geolocation failed: ${err.message}`);
      hideLoading();
    }
  );
}



// Initializing the application
document.addEventListener("DOMContentLoaded", () => {
  // DEBUG/SHORTLINK LOGIC
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has('clear')) {
    localStorage.clear();
    window.location.search = ''; // Reload cleanly
    return;
  }

  if (urlParams.has('debug') || urlParams.has('results')) {
    console.log("🛠️ Debug Mode Active: Bypassing Wizard");
    const mockLoc = { latitude: 48.1351, longitude: 11.5820, name: "München (Debug)" };
    localStorage.setItem('skigebiete_user_location', JSON.stringify(mockLoc));
    // Set default wizard state to results
    // store.setState not available yet? It is imported.
    const debugDomain = urlParams.get('domain') || 'ski';
    store.setState({ currentDomain: debugDomain, viewMode: 'top3', preference: 'fast' });
    // Proceed to standard init
  }

  // 1. Initial State
  const savedLocation = localStorage.getItem('skigebiete_user_location');
  const wizardContainer = document.getElementById("wizardContainer");
  const resultsView = document.getElementById("resultsView");

  store.setState({
    filter: 'top3',
    viewMode: 'top3',
    preference: 'fast' // Default
  });

  // 2. Initial View Decision
  if (savedLocation) {
    wizardContainer.style.display = "none";
    resultsView.style.display = "block";

    const loc = JSON.parse(savedLocation);
    const heading = document.getElementById("resultsHeading");
    if (heading) heading.textContent = `Beste Wahl heute von ${loc.name || 'deinem Standort'}`;

    // Default to ski if loading from saved and no domain set
    if (!store.get().currentDomain) {
      store.setState({ currentDomain: 'ski' });
    }
    load();
  } else {
    wizardContainer.style.display = "block";
    resultsView.style.display = "none";

    // Restore Step Logic
    const savedStep = localStorage.getItem('wizard_current_step');
    const stepLocation = document.getElementById('step-location');
    const stepActivity = document.getElementById('step-activity');
    const stepPrefs = document.getElementById('step-prefs');

    // Hide all first
    if (stepLocation) stepLocation.style.display = 'none';
    if (stepActivity) stepActivity.style.display = 'none';
    if (stepPrefs) stepPrefs.style.display = 'none';

    // Show saved or default
    if (savedStep && document.getElementById(savedStep)) {
      document.getElementById(savedStep).style.display = 'block';
      // Ensure badges/headers are updated if needed (simplified here)
    } else {
      if (stepLocation) stepLocation.style.display = 'block';
    }
  }

  initEventListeners({
    load,
    render,
    handleAddressSearch,
    handleGeolocation,
    fetchTrafficForLocation,
    getCurrentSearchLocation
  });
});
