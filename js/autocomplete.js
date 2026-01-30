/**
 * Address Autocomplete Module
 * Handles address suggestions with debouncing, keyboard navigation, and PLZ support
 */
import { API_BASE_URL } from "./config.js";

let autocompleteTimeout = null;
let currentSuggestions = [];
let selectedIndex = -1;

/**
 * Initialize autocomplete for the address input
 */
export function initAutocomplete() {
    const input = document.getElementById("addressInput");
    const list = document.getElementById("autocompleteList");

    if (!input || !list) {
        console.warn("Autocomplete: Input or list element not found");
        return;
    }

    // Input event with debounce
    input.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
        }

        // Hide dropdown if query is too short
        if (query.length < 2) {
            hideDropdown(list);
            return;
        }

        // Debounce: Wait 300ms after typing stops
        autocompleteTimeout = setTimeout(() => {
            fetchSuggestions(query, list);
        }, 300);
    });

    // Keyboard navigation
    input.addEventListener("keydown", (e) => {
        if (!list.classList.contains("active")) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                navigateSuggestions(1, list);
                break;
            case "ArrowUp":
                e.preventDefault();
                navigateSuggestions(-1, list);
                break;
            case "Enter":
                if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
                    e.preventDefault();
                    selectSuggestion(currentSuggestions[selectedIndex], input, list);
                }
                break;
            case "Escape":
                hideDropdown(list);
                break;
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".autocomplete-wrapper")) {
            hideDropdown(list);
        }
    });

    // Focus shows dropdown if there are cached suggestions
    input.addEventListener("focus", () => {
        if (currentSuggestions.length > 0 && input.value.length >= 2) {
            showDropdown(list);
        }
    });
}

/**
 * Fetch suggestions from the backend autocomplete endpoint
 */
async function fetchSuggestions(query, list) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/locating/autocomplete?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            console.warn("Autocomplete API error:", response.status);
            return;
        }

        const suggestions = await response.json();
        currentSuggestions = suggestions;
        selectedIndex = -1;

        renderSuggestions(suggestions, list, query);
    } catch (error) {
        console.warn("Autocomplete fetch error:", error);
    }
}

/**
 * Render suggestions in the dropdown
 */
function renderSuggestions(suggestions, list, query) {
    list.innerHTML = "";

    if (!suggestions || suggestions.length === 0) {
        hideDropdown(list);
        return;
    }

    // Detect if query looks like a postal code (5 digits for Germany)
    const isPLZ = /^\d{4,5}$/.test(query);

    suggestions.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "autocomplete-item";
        li.dataset.index = index;

        // Choose icon based on type detection
        const icon = isPLZ ? "📮" : "📍";

        li.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="name">${escapeHtml(item.shortName || item.name.split(",")[0])}</span>
            <span class="region">${escapeHtml(item.region || "")}</span>
        `;

        li.addEventListener("click", () => {
            selectSuggestion(item, document.getElementById("addressInput"), list);
        });

        li.addEventListener("mouseenter", () => {
            updateActiveItem(index, list);
        });

        list.appendChild(li);
    });

    showDropdown(list);
}

/**
 * Navigate through suggestions with keyboard
 */
function navigateSuggestions(direction, list) {
    const items = list.querySelectorAll(".autocomplete-item");
    if (items.length === 0) return;

    selectedIndex += direction;

    // Wrap around
    if (selectedIndex < 0) selectedIndex = items.length - 1;
    if (selectedIndex >= items.length) selectedIndex = 0;

    updateActiveItem(selectedIndex, list);
}

/**
 * Update the active/highlighted item
 */
function updateActiveItem(index, list) {
    const items = list.querySelectorAll(".autocomplete-item");
    items.forEach((item, i) => {
        item.classList.toggle("active", i === index);
    });
    selectedIndex = index;
}

/**
 * Select a suggestion and update the input
 */
function selectSuggestion(item, input, list) {
    if (!item || !input) return;

    // Update input value with the full name
    input.value = item.name;

    // Store coordinates in data attributes for later use
    input.dataset.latitude = item.latitude;
    input.dataset.longitude = item.longitude;
    input.dataset.locationName = item.name;

    hideDropdown(list);

    // Dispatch custom event so app.js can use the selected location
    const event = new CustomEvent("autocomplete-select", {
        detail: {
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude
        }
    });
    input.dispatchEvent(event);

    console.log("📍 Autocomplete selected:", item.name);
}

/**
 * Show the dropdown
 */
function showDropdown(list) {
    list.classList.add("active");
}

/**
 * Hide the dropdown
 */
function hideDropdown(list) {
    list.classList.remove("active");
    selectedIndex = -1;
}

/**
 * Simple HTML escape
 */
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
