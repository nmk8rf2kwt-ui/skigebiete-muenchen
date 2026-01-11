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

    // Top N Filter Buttons (Top 3, Top 5, Top 10)
    document.querySelectorAll(".top-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const topN = parseInt(btn.dataset.top, 10);
            const currentFilter = store.get().filter;

            // Toggle: if already active, reset to "all"
            if (currentFilter === `top${topN}`) {
                store.setState({ filter: "all" }, render);
                // Reset all button styles
                document.querySelectorAll(".top-filter-btn").forEach(b => b.classList.remove("active"));
            } else {
                store.setState({ filter: `top${topN}` }, render);
                // Highlight active button
                document.querySelectorAll(".top-filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            }
        });
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


    // Global Modal Click-to-Close
    window.addEventListener("click", (event) => {
        if (event.target === weatherModal) weatherModal.style.display = "none";
        if (event.target === detailsModal) detailsModal.style.display = "none";
        if (event.target === historyModal) historyModal.style.display = "none";
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
