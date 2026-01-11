import { store } from "./store.js";
import { API_BASE_URL } from "./config.js";
import {
    displayWeather,
    displayResortDetails,
    switchHistoryTab,
    fetchSystemStatus,
    setCurrentResortId,
    resetModalStates
} from "./modals.js";

/**
 * Initialize all event listeners for the application
 * @param {object} handlers - Object containing global handler functions from app.js
 */
export function initEventListeners(handlers) {
    const {
        load,
        render,
        handleAddressSearch,
        handleGeolocation,
        fetchTrafficForLocation,
        getCurrentSearchLocation
    } = handlers;

    // Initial Load & Auto-refresh
    load();
    setInterval(load, 30 * 60 * 1000);

    /**
     * WIZARD STEP NAVIGATION
     */
    const wizardContainer = document.getElementById("wizardContainer");
    const resultsView = document.getElementById("resultsView");
    const stepLocation = document.getElementById("step-location");
    const stepPrefs = document.getElementById("step-prefs");

    // Location Submit -> Prefs
    document.getElementById("submitLocationBtn").addEventListener("click", () => {
        const input = document.getElementById("addressInput").value;
        if (input.length >= 3) {
            handleAddressSearch().then(() => {
                stepLocation.style.display = "none";
                stepPrefs.style.display = "block";
            });
        } else {
            alert("Bitte gib einen Standort ein (mind. 3 Zeichen).");
        }
    });

    // Back from Prefs to Location
    document.getElementById("backToLocation").addEventListener("click", () => {
        stepPrefs.style.display = "none";
        stepLocation.style.display = "block";
    });

    // Preference Selection
    document.querySelectorAll(".pref-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            store.setState({ preference: btn.dataset.pref });
        });
    });

    // Show Results
    document.getElementById("showResultsBtn").addEventListener("click", () => {
        wizardContainer.style.display = "none";
        resultsView.style.display = "block";

        // Update Heading
        const loc = getCurrentSearchLocation();
        document.getElementById("resultsHeading").textContent = `Beste Wahl heute von ${loc.name || 'deinem Standort'}`;

        // Trigger rendering of results
        render();
    });

    // Restart Wizard
    document.getElementById("restartWizard").addEventListener("click", () => {
        resultsView.style.display = "none";
        wizardContainer.style.display = "block";
        stepLocation.style.display = "block";
        stepPrefs.style.display = "none";
    });

    // Geolocation Success (Auto-advance)
    const originalHandleGeo = handleGeolocation;
    const interceptedHandleGeo = async () => {
        await originalHandleGeo();
        // Wait a bit for geocoding to finish and store to update
        setTimeout(() => {
            stepLocation.style.display = "none";
            stepPrefs.style.display = "block";
        }, 800);
    };
    document.getElementById("locateBtn").onclick = interceptedHandleGeo;

    // View Switcher (Wizard Version)
    document.querySelectorAll(".view-switcher-wizard .view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const nextView = btn.dataset.view;
            document.querySelectorAll(".view-switcher-wizard .view-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Toggle visibility of sub-views
            const mapView = document.getElementById("map-view");
            const tableView = document.getElementById("tableView");
            const top3Cards = document.getElementById("top3Cards");

            if (nextView === 'top3') {
                top3Cards.style.display = "grid";
                mapView.style.display = "none";
                tableView.style.display = "none";
            } else if (nextView === 'map') {
                top3Cards.style.display = "none";
                mapView.style.display = "block";
                tableView.style.display = "none";
            } else {
                top3Cards.style.display = "none";
                mapView.style.display = "none";
                tableView.style.display = "block";
            }

            store.setState({ viewMode: nextView }, render);
        });
    });

    // Search input Enter key
    document.getElementById("addressInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') document.getElementById("submitLocationBtn").click();
    });

    // Sort Headers (Desktop Table Headers)
    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
            const newSort = th.dataset.sort;
            const state = store.get();
            const currentSort = state.sortKey;
            let sortDirection = state.sortDirection;

            if (currentSort === newSort) {
                sortDirection = sortDirection === "desc" ? "asc" : "desc";
            } else {
                sortDirection = ['distance', 'distance_km', 'traffic_duration', 'price'].includes(newSort) ? "asc" : "desc";
            }

            store.setState({ sortKey: newSort, sortDirection }, render);
        });
    });

    // Sort Buttons (Toolbar)
    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const newSort = btn.dataset.sort;
            const state = store.get();
            const currentSort = state.sortKey;
            let sortDirection = state.sortDirection;

            // Toggle direction if same sort, otherwise default direction
            if (currentSort === newSort) {
                sortDirection = sortDirection === "desc" ? "asc" : "desc";
            } else {
                sortDirection = ['distance', 'distance_km', 'traffic_duration', 'price'].includes(newSort) ? "asc" : "desc";
            }

            store.setState({ sortKey: newSort, sortDirection }, render);

            // Highlight active sort button
            document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    /**
     * Modal Event Handlers
     */

    // Weather Modal
    const weatherModal = document.getElementById("weatherModal");
    const closeWeatherBtn = document.querySelector(".close");
    if (closeWeatherBtn) {
        closeWeatherBtn.addEventListener("click", () => weatherModal.style.display = "none");
    }

    // Details Modal
    const detailsModal = document.getElementById("detailsModal");
    const closeDetailsBtn = document.querySelector(".close-details");
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener("click", () => detailsModal.style.display = "none");
    }

    // History Modal
    const historyModal = document.getElementById("historyModal");
    const closeHistoryBtn = document.querySelector(".close-history");
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener("click", () => historyModal.style.display = "none");
    }

    // Score Modal
    const scoreModal = document.getElementById("scoreModal");
    const closeScoreBtn = document.querySelector(".close-score");
    const scoreTrigger = document.getElementById("scoreInfoTrigger");
    if (scoreTrigger) {
        scoreTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            scoreModal.style.display = "block";
        });
    }
    if (closeScoreBtn) {
        closeScoreBtn.addEventListener("click", () => scoreModal.style.display = "none");
    }


    // Global Modal Click-to-Close
    window.addEventListener("click", (event) => {
        if (event.target === weatherModal) weatherModal.style.display = "none";
        if (event.target === detailsModal) detailsModal.style.display = "none";
        if (event.target === historyModal) historyModal.style.display = "none";
        if (event.target === scoreModal) scoreModal.style.display = "none";
    });

    // Delegated Clicks for Buttons in Dynamic Content (Table)
    document.addEventListener("click", async (event) => {
        // Use closest to handle clicks on children (icons, text)
        const weatherBtn = event.target.closest('.weather-btn');
        const detailsBtn = event.target.closest('.details-btn');
        const historyBtn = event.target.closest('.history-btn');
        const tabBtn = event.target.closest('.tab-btn');

        // Weather Button
        if (weatherBtn) {
            const { resortId, resortName } = weatherBtn.dataset;
            weatherModal.style.display = "block";
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

        // Details Button
        if (detailsBtn) {
            const { resortId, resortName } = detailsBtn.dataset;
            const resort = store.get().resorts.find(r => r.id === resortId);

            if (!resort) {
                alert("Resort data not found");
                return;
            }

            detailsModal.style.display = "block";
            document.getElementById("detailsResortName").textContent = `${resortName} - Details`;
            displayResortDetails(resort);
        }

        // Traffic Analysis (Legacy History Button / New Traffic Cell)
        if (historyBtn) {
            const { resortId } = historyBtn.dataset; // Name might be missing on div triggers
            // Lookup name from store if missing
            const resort = store.get().resorts.find(r => r.id === resortId);
            const resortName = resort ? resort.name : (historyBtn.dataset.resortName || 'Resort');

            setCurrentResortId(resortId);
            resetModalStates();

            historyModal.style.display = "block";
            document.getElementById("historyResortName").textContent = `${resortName} - Verkehrsprognose`;

            // Explicitly load the traffic chart
            // We need to dynamically import or ensure this function is available. 
            // It is exported from modals.js. We need to update imports first!
            // However, switchHistoryTab('traffic') does exactly this logic internally if we kept it.
            // But we wanted to simplify.
            // Let's assume switchHistoryTab('traffic') is easiest path IF we keep the tab switching logic in modals.js purely for loading, 
            // even if tabs are hidden.
            // Actually, I'll update imports in next step to import loadResortTrafficHistory directly.
            // TEMPORARY: using switchHistoryTab for compatibility if I haven't removed it yet.
            switchHistoryTab('traffic');
        }

        // Tab Switching in History Modal (if any tabs left)
        if (tabBtn) {
            switchHistoryTab(tabBtn.dataset.tab);
        }
    });

}
