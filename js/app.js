import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap, showUserLocation } from "./map.js";
import { API_BASE_URL } from "./config.js";
import { store } from "./store.js";
import { escapeHtml, getDistanceFromLatLonInKm, debugLog, debugGroup, debugGroupEnd } from "./utils.js";
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
    <span style="color: #999;">[${time}]</span> ${escapeHtml(message)}
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
  const entry = `<div class="status-entry ${type}">
    <span class="status-time">[${time}]</span> ${icon} ${escapeHtml(msg)}
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



    let resorts = [];
    try {
      // Sanitize URL construction
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
      const finalUrl = `${cleanBase}${cleanEndpoint}`;

      const response = await fetch(finalUrl, { signal: controller.signal });
      if (!response.ok) throw new Error("API 404");
      resorts = await response.json();
    } catch (apiErr) {
      console.warn(`⚠️ API Failed (${apiErr.message}), attempting static fallback...`);
      // Fallback Mapping for GH Pages (Static)
      let fallbackUrl = 'backend/resorts.json'; // Default Ski
      if (domainId === 'skate') fallbackUrl = 'backend/data/ice-skating.json';
      if (domainId === 'sled') fallbackUrl = 'backend/data/sledding.json';
      if (domainId === 'skitour') fallbackUrl = 'backend/data/skitours.json';
      if (domainId === 'walk') fallbackUrl = 'backend/data/winter-walks.json';

      console.log(`👉 Fetching fallback: ${fallbackUrl}`);
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) throw new Error(`Fallback failing: ${fallbackUrl}`);
      resorts = await fallbackResponse.json();
    }

    clearTimeout(timeoutId);

    debugGroup("🔍 DIAGNOSTIC: Data Load");
    debugLog(`[API] Raw count: ${resorts ? resorts.length : 0}`);

    if (!resorts || resorts.length === 0) {
      console.warn("⚠️ API returned empty array!");
      debugGroupEnd();
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

    debugLog(`[Enriched] Count: ${enhancedResorts.length}`, enhancedResorts[0]);
    debugGroupEnd();

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
  debugGroup("🎨 DIAGNOSTIC: Render Phase");
  debugLog(`State: Mode=${viewMode}, Domain=${currentDomain}, Resorts=${resorts?.length}`);

  if (!resorts || !resorts.length) {
    console.warn("⚠️ Render called with empty resorts!");
    debugGroupEnd();
    return;
  }

  const resultsGrid = document.getElementById("top3Cards");
  const tableView = document.getElementById("tableView");
  const mapView = document.getElementById("map-view");

  // Filter and Sort based on current UI state
  const sortedResorts = [...resorts].sort((a, b) => b.smartScore - a.smartScore);
  debugLog(`Top Resort: ${sortedResorts[0].name} (Score: ${sortedResorts[0].smartScore})`);

  if (viewMode === 'top3') {
    debugLog("👉 Delegating to renderTop3Cards");
    import("./render.js").then(module => module.renderTop3Cards(sortedResorts.slice(0, 3)));
  } else if (viewMode === 'table') {
    debugLog("👉 Delegating to renderTable");
    renderTable(sortedResorts, undefined, 'all');
  } else if (viewMode === 'map') {
    debugLog("👉 Delegating to Map (Init & Update)");
    initMap(sortedResorts);
    updateMap(sortedResorts);
  }

  debugGroupEnd();

  // Also ensure map is updated if it exists (e.g. background update)
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

    // Use backend endpoint to ensure usage tracking
    const response = await fetch(`${API_BASE_URL}/api/locating/geocode?q=${encodeURIComponent(address)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      showError("Standort nicht gefunden. Bitte versuche es genauer.");
      return false;
    }

    if (!response.ok) throw new Error("Geocoding fehlgeschlagen");

    const data = await response.json();

    if (data && data.latitude && data.longitude) {
      const { name, latitude, longitude } = data;

      setCurrentSearchLocation({ latitude, longitude, name });
      store.saveUserLocation({ latitude, longitude, name }); // Save persistence
      logToUI(`Standort erkannt: ${name}`, "success");

      // Auto-load after location fix
      await fetchTrafficForLocation(latitude, longitude, name);
      return true;
    } else {
      showError("Ungültige Daten empfangen.");
      return false;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      showError("Zeitüberschreitung bei der Suche.");
    } else {
      showError(`Such-Fehler: ${err.message}`);
    }
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

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentSearchLocation({ latitude, longitude, name: "Ihre aktuelle Position" });
        store.saveUserLocation({ latitude, longitude, name: "Ihre aktuelle Position" });
        logToUI("Eigener Standort gefunden", "success");
        fetchTrafficForLocation(latitude, longitude, "Ihre Position");
        resolve(true);
      },
      (err) => {
        showError(`Geolocation failed: ${err.message}`);
        hideLoading();
        resolve(false); // Resolve false so we don't crash, but user stays on step 1
      }
    );
  });
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
    store.saveUserLocation(mockLoc);
    // Set default wizard state to results
    // store.setState not available yet? It is imported.
    const debugDomain = urlParams.get('domain') || 'ski';
    store.setState({ currentDomain: debugDomain, viewMode: 'top3', preference: 'fast' });
    // Proceed to standard init
  }

  // 1. Initial State
  const savedLocation = store.getUserLocation();
  const wizardContainer = document.getElementById("wizardContainer");
  const resultsView = document.getElementById("resultsView");

  // DOM Elements for Steps
  const stepLocation = document.getElementById("step-location");
  const stepActivity = document.getElementById("step-activity");
  const stepPrefs = document.getElementById("step-prefs");

  store.setState({
    filter: 'top3',
    viewMode: 'top3',
    preference: 'fast' // Default
  });

  // 2. Initial View Decision
  if (urlParams.has('results') || urlParams.has('debug')) {
    // Debug/Deep Link: Show Results Immediately
    if (wizardContainer) wizardContainer.style.display = "none";
    if (resultsView) resultsView.style.display = "block";

    // Ensure we have a domain if not set
    if (!store.get().currentDomain) {
      store.setState({ currentDomain: 'ski' });
    }
    load();
  } else if (savedLocation) {
    // Returning User: Sync state but START AT WIZARD STEP 2
    const loc = savedLocation;
    setCurrentSearchLocation(loc);

    // Show Wizard, Hide Results
    if (wizardContainer) wizardContainer.style.display = "block";
    if (resultsView) resultsView.style.display = "none";

    // Jump to Step 2
    if (stepLocation) stepLocation.style.display = 'none';
    if (stepActivity) stepActivity.style.display = 'block';
    if (stepPrefs) stepPrefs.style.display = 'none';

    logToUI(`Willkommen zurück! Standort: ${loc.name}`, 'success');

    // Pre-load data in background
    if (!store.get().currentDomain) {
      store.setState({ currentDomain: 'ski' });
    }
    load();
  } else {
    // New User: Start at Step 1
    if (wizardContainer) wizardContainer.style.display = "block";
    if (resultsView) resultsView.style.display = "none";

    if (stepLocation) stepLocation.style.display = 'block';
    if (stepActivity) stepActivity.style.display = 'none';
    if (stepPrefs) stepPrefs.style.display = 'none';
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
