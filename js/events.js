import { store } from "./store.js";
import { API_BASE_URL } from "./config.js";
import {
    displayWeather,
    displayResortDetails,
    displayHistoryChart,
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

    // Search
    document.getElementById("searchBtn").addEventListener("click", handleAddressSearch);
    document.getElementById("locateBtn").addEventListener("click", handleGeolocation);
    document.getElementById("addressInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') handleAddressSearch();
    });

    // Radius Slider
    const radiusSlider = document.getElementById("radiusSlider");
    const radiusValue = document.getElementById("radiusValue");

    // Sync initial state from DOM (browser might cache input value on reload)
    if (radiusSlider) {
        store.setState({ radius: parseInt(radiusSlider.value, 10) });
        if (radiusValue) radiusValue.textContent = `${radiusSlider.value} km`;
    }
    if (radiusSlider && radiusValue) {
        // Update UI and Filter immediately on slide
        radiusSlider.addEventListener("input", () => {
            const val = parseInt(radiusSlider.value, 10);
            radiusValue.textContent = `${val} km`;
            store.setState({ radius: val }, render);
        });
    }

    // View & Filter Buttons
    document.getElementById("viewToggle").addEventListener("click", () => {
        const nextMode = store.get().viewMode === "list" ? "map" : "list";
        document.getElementById("viewToggle").textContent = nextMode === "list" ? "🗺️ Kartenansicht" : "📄 Listenansicht";
        store.setState({ viewMode: nextMode }, render);
    });

    document.getElementById("top3").addEventListener("click", () => {
        const nextFilter = store.get().filter === "top3" ? "all" : "top3";
        document.getElementById("top3").textContent = nextFilter === "top3" ? "❌ Alle anzeigen" : "🏆 Nur Top-3 heute";
        store.setState({ filter: nextFilter }, render);
    });

    // Sort Headers (Desktop)
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

    // Mobile Sort Buttons
    document.querySelectorAll(".sort-mobile button").forEach(btn => {
        btn.addEventListener("click", () => {
            store.setState({ sortKey: btn.dataset.sort }, render);
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

    // Status Modal
    const statusModal = document.getElementById("statusModal");
    const closeStatusBtn = document.querySelector(".close-status");

    document.getElementById("openStatusBtn").addEventListener("click", (e) => {
        e.preventDefault();
        statusModal.style.display = "block";
        fetchSystemStatus();
        if (!window.statusInterval) {
            window.statusInterval = setInterval(fetchSystemStatus, 5000);
        }
    });

    if (closeStatusBtn) {
        closeStatusBtn.addEventListener("click", () => {
            statusModal.style.display = "none";
            if (window.statusInterval) {
                clearInterval(window.statusInterval);
                window.statusInterval = null;
            }
        });
    }

    // Global Modal Click-to-Close
    window.addEventListener("click", (event) => {
        if (event.target === weatherModal) weatherModal.style.display = "none";
        if (event.target === detailsModal) detailsModal.style.display = "none";
        if (event.target === historyModal) historyModal.style.display = "none";
        if (event.target === statusModal) {
            statusModal.style.display = "none";
            if (window.statusInterval) {
                clearInterval(window.statusInterval);
                window.statusInterval = null;
            }
        }
    });

    // Delegated Clicks for Buttons in Dynamic Content (Table)
    document.addEventListener("click", async (event) => {
        const target = event.target;

        // Weather Button
        if (target.classList.contains("weather-btn")) {
            const { resortId, resortName } = target.dataset;
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
        if (target.classList.contains("details-btn")) {
            const { resortId, resortName } = target.dataset;
            const resort = store.get().resorts.find(r => r.id === resortId);

            if (!resort) {
                alert("Resort data not found");
                return;
            }

            detailsModal.style.display = "block";
            document.getElementById("detailsResortName").textContent = `${resortName} - Details`;
            displayResortDetails(resort);
        }

        // History Button
        if (target.classList.contains("history-btn")) {
            const { resortId, resortName } = target.dataset;
            setCurrentResortId(resortId);
            resetModalStates();
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

        // Tab Switching in History Modal
        if (target.classList.contains('tab-btn')) {
            switchHistoryTab(target.dataset.tab);
        }
    });

    // Sentry Session Replay Test Button
    const testSentryBtn = document.getElementById("testSentryBtn");
    if (testSentryBtn) {
        testSentryBtn.addEventListener("click", async () => {
            const resultDiv = document.getElementById("sentryTestResult");
            if (!window.Sentry) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ Sentry ist nicht geladen</span>';
                return;
            }

            testSentryBtn.disabled = true;
            testSentryBtn.textContent = "⏳ Sende Test...";
            resultDiv.innerHTML = '<span style="color: #3498db;">📡 Sende Test-Fehler an Sentry...</span>';

            try {
                window.Sentry.captureMessage('Test: Session Replay Verification', 'info');
                setTimeout(() => {
                    try {
                        throw new Error('🧪 Test Error: Session Replay Verification - ' + new Date().toISOString());
                    } catch (error) {
                        window.Sentry.captureException(error);
                        resultDiv.innerHTML = `
                            <div style="color: #27ae60; background: #d4edda; padding: 10px; border-radius: 4px; border-left: 4px solid #27ae60;">
                                <strong>✅ Test erfolgreich!</strong><br>
                                <small>
                                    • Fehler wurde an Sentry gesendet<br>
                                    • Session Replay wurde aufgezeichnet<br>
                                    • Überprüfen Sie Ihr Sentry Dashboard in ~30 Sekunden
                                </small>
                            </div>
                        `;
                        testSentryBtn.disabled = false;
                        testSentryBtn.textContent = "🎬 Session Replay testen";
                    }
                }, 1000);
            } catch (error) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ Fehler beim Test: ' + error.message + '</span>';
                testSentryBtn.disabled = false;
                testSentryBtn.textContent = "🎬 Session Replay testen";
            }
        });
    }
}
