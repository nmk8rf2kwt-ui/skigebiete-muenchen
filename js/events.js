import { store } from "./store.js";
import { API_BASE_URL } from "./config.js";
import { DOMAIN_CONFIGS } from "./domainConfigs.js";

function setDomain(domainId) {
    const config = DOMAIN_CONFIGS[domainId];
    if (!config) return;

    store.setState({
        currentDomain: domainId,
        preference: config.prefs[0].id // Set default pref for domain
    });

    // Update UI Elements
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.textContent = `${config.icon} ${config.label}-Finder`;

    const locationHeading = document.getElementById('locationHeadingElement');
    if (locationHeading) locationHeading.textContent = `${config.icon} Von wo startest du?`;

    const prefHeading = document.querySelector('#step-prefs h2');
    if (prefHeading) prefHeading.textContent = `${config.icon} Was ist dir heute wichtig?`;

    updatePreferenceUI(config);

    // Transition to Preferences Step (Step 3)
    document.getElementById('step-activity').style.display = 'none';
    document.getElementById('step-prefs').style.display = 'block';
}

function updatePreferenceUI(config) {
    const prefGrid = document.querySelector('#step-prefs .pref-grid');
    if (!prefGrid) return;

    prefGrid.innerHTML = config.prefs.map(p => `
    <button class="pref-btn ${store.get().preference === p.id ? 'active' : ''}" data-pref="${p.id}">
      <span class="pref-icon">${p.icon}</span>
      <span class="pref-label">${p.label}</span>
    </button>
  `).join('');

    // Re-attach listeners to new buttons
    prefGrid.querySelectorAll('.pref-btn').forEach(btn => {
        btn.onclick = () => {
            prefGrid.querySelectorAll('.pref-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            store.setState({ preference: btn.dataset.pref });
        };
    });
}

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
    const stepActivity = document.getElementById("step-activity");
    const stepPrefs = document.getElementById("step-prefs");

    // Wizard Step 1: Location Submit -> Activity (Step 2)
    document.getElementById("submitLocationBtn").addEventListener("click", () => {
        const input = document.getElementById("addressInput").value;
        if (input.length >= 3) {
            handleAddressSearch().then((success) => {
                if (success) {
                    stepLocation.style.display = "none";
                    stepActivity.style.display = "block";
                }
            });
        } else {
            alert("Bitte gib einen Standort ein (mind. 3 Zeichen).");
        }
    });

    // Wizard Step 2: Activity Selection -> Prefs (Step 3)
    document.querySelectorAll("#step-activity .pref-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!btn.disabled) {
                setDomain(btn.dataset.domain);
            }
        });
    });

    // Back from Activity (Step 2) to Location (Step 1)
    const backToLocFromActBtn = document.getElementById("backToLocationFromActivity");
    if (backToLocFromActBtn) {
        backToLocFromActBtn.addEventListener("click", () => {
            stepActivity.style.display = "none";
            stepLocation.style.display = "block";
        });
    }

    // Back from Prefs (Step 3) to Activity (Step 2)
    const backToActBtn = document.getElementById("backToActivity");
    if (backToActBtn) {
        backToActBtn.addEventListener("click", () => {
            stepPrefs.style.display = "none";
            stepActivity.style.display = "block";
        });
    }

    // Preference Selection (Step 3)
    document.querySelector("#step-prefs .pref-grid").addEventListener("click", (e) => {
        const btn = e.target.closest(".pref-btn");
        if (btn && !btn.disabled) {
            document.querySelectorAll("#step-prefs .pref-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            store.setState({ preference: btn.dataset.pref });
        }
    });

    // Show Results
    document.getElementById("showResultsBtn").addEventListener("click", () => {
        wizardContainer.style.display = "none";
        resultsView.style.display = "block";

        const loc = getCurrentSearchLocation();
        document.getElementById("resultsHeading").textContent = `Beste Wahl heute von ${loc.name || 'deinem Standort'}`;

        render();
    });

    // Restart Wizard
    document.getElementById("restartWizard").addEventListener("click", () => {
        resultsView.style.display = "none";
        wizardContainer.style.display = "block";
        stepLocation.style.display = "block";
        stepActivity.style.display = "none";
        stepPrefs.style.display = "none";
    });

    // Geolocation Success (Auto-advance)
    const originalHandleGeo = handleGeolocation;
    const interceptedHandleGeo = async () => {
        await originalHandleGeo();
        setTimeout(() => {
            stepLocation.style.display = "none";
            stepActivity.style.display = "block"; // Go to Activity next
        }, 800);
    };
    document.getElementById("locateBtn").onclick = interceptedHandleGeo;

    // View Switcher (Wizard Version)
    document.querySelectorAll(".view-switcher-wizard .view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const nextView = btn.dataset.view;
            document.querySelectorAll(".view-switcher-wizard .view-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

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

    // Sort Headers
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

    // Sort Buttons
    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const newSort = btn.dataset.sort;
            const state = store.get();
            const currentSort = state.sortKey;
            let sortDirection = state.sortDirection;
            if (currentSort === newSort) {
                sortDirection = sortDirection === "desc" ? "asc" : "desc";
            } else {
                sortDirection = ['distance', 'distance_km', 'traffic_duration', 'price'].includes(newSort) ? "asc" : "desc";
            }
            store.setState({ sortKey: newSort, sortDirection }, render);
            document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Modals
    const weatherModal = document.getElementById("weatherModal");
    const closeWeatherBtn = document.querySelector(".close");
    if (closeWeatherBtn) closeWeatherBtn.addEventListener("click", () => weatherModal.style.display = "none");

    const detailsModal = document.getElementById("detailsModal");
    const closeDetailsBtn = document.querySelector(".close-details");
    if (closeDetailsBtn) closeDetailsBtn.addEventListener("click", () => detailsModal.style.display = "none");

    const historyModal = document.getElementById("historyModal");
    const closeHistoryBtn = document.querySelector(".close-history");
    if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => historyModal.style.display = "none");

    const scoreModal = document.getElementById("scoreModal");
    const closeScoreBtn = document.querySelector(".close-score");
    const scoreTrigger = document.getElementById("scoreInfoTrigger");
    if (scoreTrigger) scoreTrigger.addEventListener("click", (e) => { e.stopPropagation(); scoreModal.style.display = "block"; });
    if (closeScoreBtn) closeScoreBtn.addEventListener("click", () => scoreModal.style.display = "none");

    window.addEventListener("click", (event) => {
        if (event.target === weatherModal) weatherModal.style.display = "none";
        if (event.target === detailsModal) detailsModal.style.display = "none";
        if (event.target === historyModal) historyModal.style.display = "none";
        if (event.target === scoreModal) scoreModal.style.display = "none";
    });

    // Unified Global Click Listener (Event Delegation)
    document.addEventListener("click", async (event) => {
        // Modal logic for Weather, History, Tabs (can also be migrated to data-action but kept for compatibility)
        const weatherBtn = event.target.closest('.weather-btn');
        const historyBtn = event.target.closest('.history-btn');
        const tabBtn = event.target.closest('.tab-btn');

        // NEW: Data Action Logic (replacing inline onclicks)
        const actionBtn = event.target.closest('[data-action]');

        if (actionBtn) {
            const action = actionBtn.dataset.action;

            if (action === 'route') {
                const dest = actionBtn.dataset.destination;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
            }
            else if (action === 'share') {
                const data = {
                    title: actionBtn.dataset.title,
                    url: actionBtn.dataset.url
                };
                if (navigator.share) {
                    navigator.share(data).catch(console.error);
                } else {
                    alert('Teilen wird von deinem Browser nicht unterstützt.\nURL kopiert: ' + data.url);
                    // Minimal fallback: copy to clipboard could be added here
                }
            }
            else if (action === 'ticket') {
                const id = actionBtn.dataset.id;
                import('./utils.js').then(u => u.trackClick(id, 'ticket'));
                // Note: The <a> tag logic continues naturally (opening link)
                // We just intercepted to track.
            }
            else if (action === 'details') {
                const { resortId, resortName } = actionBtn.dataset;
                const resort = store.get().resorts.find(r => r.id === resortId);
                if (resort) {
                    detailsModal.style.display = "block";
                    document.getElementById("detailsResortName").textContent = `${resortName} - Details`;
                    displayResortDetails(resort);
                }
            }
            else if (action === 'toggle-reasoning') {
                const summary = actionBtn;
                // Requires structure assumption: .reasoning-summary + .reasoning-list
                const content = summary.nextElementSibling;
                const icon = summary.querySelector('.toggle-icon');

                if (content && icon) {
                    content.classList.toggle('expanded');
                    icon.textContent = content.classList.contains('expanded') ? '▴' : '▾';
                }
            }
            else if (action === 'save') {
                alert('Merkliste demnächst verfügbar! ⭐');
            }
        }

        // Legacy/Other Modals handling (if not covered by data-action)
        if (weatherBtn) {
            const { resortId, resortName } = weatherBtn.dataset;
            weatherModal.style.display = "block";
            document.getElementById("weatherResortName").textContent = `${resortName} - 3-Day Forecast`;
            document.getElementById("weatherForecast").innerHTML = "<p>Loading...</p>";
            try {
                const res = await fetch(`${API_BASE_URL}/api/weather/${resortId}`);
                const data = await res.json();
                displayWeather(data.forecast);
            } catch (error) {
                document.getElementById("weatherForecast").innerHTML = "<p>❌ Weather data unavailable</p>";
            }
        }

        if (historyBtn) {
            const { resortId } = historyBtn.dataset;
            const resort = store.get().resorts.find(r => r.id === resortId);
            const resortName = resort ? resort.name : (historyBtn.dataset.resortName || 'Resort');
            setCurrentResortId(resortId);
            resetModalStates();
            historyModal.style.display = "block";
            document.getElementById("historyResortName").textContent = `${resortName} - Verkehrsprognose`;
            switchHistoryTab('traffic');
        }

        if (tabBtn) switchHistoryTab(tabBtn.dataset.tab);
    });
}
