import { renderTable, calculateScore } from "./render.js";
import { initMap, updateMap, showUserLocation } from "./map.js";
import { API_BASE_URL } from "./config.js";
import { store } from "./store.js";
import { escapeHtml, getDistanceFromLatLonInKm } from "./utils.js";
import { initEventListeners } from "./events.js";

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
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "warning") icon = "⚠️";
  if (type === "error") icon = "❌";

  const entry = `<div class="status-entry">
    <span style="color: #999;">[${time}]</span> ${icon} ${msg}
  </div>`;

  content.innerHTML = entry + content.innerHTML;
  container.style.display = "block";
}

export function hideError() {
  const container = document.getElementById("searchError");
  if (container) container.style.display = "none";
}

export function showLoading(msg = "Lade Live-Daten...") {
  const banner = document.getElementById("loadingBanner");
  const text = document.getElementById("loadingText");
  if (banner && text) {
    text.textContent = msg;
    banner.style.display = "flex";
  }
}

export function hideLoading() {
  const banner = document.getElementById("loadingBanner");
  if (banner) banner.style.display = "none";
}

/**
 * Load Data from Backend
 */
export async function load() {
  // Helper to process raw API data (scores, distances)
  const processData = (rawData) => {
    // Check if we are using the default Munich location
    const distToMunich = getDistanceFromLatLonInKm(
      currentSearchLocation.latitude,
      currentSearchLocation.longitude,
      MUNICH_DEFAULT.latitude,
      MUNICH_DEFAULT.longitude
    );
    const isMunich = distToMunich < 2; // Within 2km of Marienplatz

    let processed = rawData.map(resort => ({
      ...resort,
      score: calculateScore(resort),
      // Preserve static duration only if we are in Munich
      staticDuration: isMunich ? resort.distance : null
    }));

    if (currentSearchLocation.latitude) {
      processed = processed.map(resort => {
        if (resort.latitude && resort.longitude) {
          const dist = getDistanceFromLatLonInKm(
            currentSearchLocation.latitude,
            currentSearchLocation.longitude,
            resort.latitude,
            resort.longitude
          );
          // NEW: Use linearDistance property, do NOT overwrite 'distance' (which is time in mins)
          return { ...resort, linearDistance: Math.round(dist) };
        }
        return resort;
      });
    }
    return processed;
  };

  showLoading();

  // 1. Cache Strategy (Stale-While-Revalidate)
  // Instantly show old data if available
  try {
    const cached = localStorage.getItem('skigebiete_cache_v1');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const processed = processData(data);
      store.setState({ resorts: processed, lastUpdated: new Date(timestamp) }, render);
      // Ensure initMap is called if needed (render does it, but timing matters?)
      // render() calls initMap if view is map.
      console.log("⚡ Loaded from Cache");
    }
  } catch (e) {
    console.warn("Cache read failed", e);
  }

  // 2. Network Strategy (Fresh Data)
  try {
    const res = await fetch(`${API_BASE_URL}/resorts`);
    if (!res.ok) throw new Error("Failed to fetch resort data");

    let rawResorts = await res.json();

    // Update Cache
    localStorage.setItem('skigebiete_cache_v1', JSON.stringify({
      data: rawResorts,
      timestamp: new Date().getTime()
    }));

    const timestamp = new Date().toLocaleTimeString();
    document.getElementById("timestamp").textContent = timestamp;

    const finalResorts = processData(rawResorts);

    store.setState({ resorts: finalResorts, lastUpdated: new Date() }, render);
    logToUI(`Successfully loaded ${finalResorts.length} resorts`, "success");
  } catch (err) {
    showError(`Load Error: ${err.message}`);
    logToUI(`Load Error: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

/**
 * Fetch Traffic Details for a specific starting point
 */
export async function fetchTrafficForLocation(lat, lon, locationName = "custom location") {
  showLoading(`Berechne Fahrzeiten von ${locationName}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/routing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon })
    });
    if (!res.ok) throw new Error("Traffic API failed");

    const matrix = await res.json();
    const resorts = store.get().resorts;

    const updatedResorts = resorts.map(resort => {
      // Recalculate linear distance for the new location
      let linearDist = resort.linearDistance;
      if (resort.latitude && resort.longitude) {
        linearDist = Math.round(getDistanceFromLatLonInKm(lat, lon, resort.latitude, resort.longitude));
      }

      // Determine if we are near Munich for this search (fallback logic)
      const distToMunich = getDistanceFromLatLonInKm(lat, lon, MUNICH_DEFAULT.latitude, MUNICH_DEFAULT.longitude);
      const isMunich = distToMunich < 2;

      const trafficData = matrix ? (matrix[resort.id] || matrix.resorts?.[resort.id]) : null;

      if (trafficData) {
        return {
          ...resort,
          linearDistance: linearDist,
          staticDuration: isMunich ? resort.distance : null, // Reset static fallback based on new location
          // Structure for render.js (expects seconds)
          traffic: {
            duration: trafficData.duration,      // seconds
            delay: trafficData.delay,            // seconds
            distanceKm: trafficData.distanceKm   // string or number
          },
          // Helper props if needed for sorting logic that uses root props?
          // render.js uses data.traffic.distanceKm or data.distanceKm
          distanceKm: trafficData.distanceKm,

          inRadius: trafficData.inRadius
        };
      }

      // Update linear distance and static fallback even if no traffic data
      return {
        ...resort,
        linearDistance: linearDist,
        staticDuration: isMunich ? resort.distance : null
      };
    });

    store.setState({ resorts: updatedResorts }, render);
    logToUI(`Traffic times updated for ${locationName}`, "success");

    // Also update map to show user location highlight
    updateMap(updatedResorts);
    showUserLocation(lat, lon, locationName);

  } catch (err) {
    showError(`Traffic Error: ${err.message}`);
    logToUI(`Traffic Error: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

/**
 * Render logic
 */
export function render() {
  const state = store.get();
  const resorts = store.getProcessedResorts();

  // Rendering table (list mode)
  if (state.viewMode === "list") {
    document.getElementById("skiTable").style.display = "table";
    document.getElementById("map-view").style.display = "none";
    renderTable(resorts, state.sortKey, state.filter, state.sortDirection);
  } else {
    document.getElementById("skiTable").style.display = "none";
    document.getElementById("map-view").style.display = "block";
    initMap(resorts);
    updateMap(resorts);
  }
}

/**
 * Address Search Handler
 */
export async function handleAddressSearch() {
  const input = document.getElementById("addressInput").value;
  if (!input || input.length < 3) return;

  showLoading(`Suche Standort: ${input}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/locating/geocode?q=${input}`);
    if (!res.ok) throw new Error("Geocoding failed");

    const data = await res.json();
    if (!data || !data.latitude) throw new Error("Ort nicht gefunden");

    setCurrentSearchLocation({
      latitude: data.latitude,
      longitude: data.longitude,
      name: data.name || input
    });

    logToUI(`Standort gefunden: ${currentSearchLocation.name}`, "success");
    fetchTrafficForLocation(data.latitude, data.longitude, currentSearchLocation.name);

  } catch (err) {
    showError(`Such-Fehler: ${err.message}`);
  } finally {
    hideLoading();
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
  initEventListeners({
    load,
    render,
    handleAddressSearch,
    handleGeolocation,
    fetchTrafficForLocation,
    getCurrentSearchLocation
  });
});
