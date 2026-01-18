let map = null;
let markers = [];

export function initMap(resorts) {
    if (map) return; // Already initialized

    // Default center: Munich/Alps
    map = L.map('map-view').setView([47.6, 11.5], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    updateMap(resorts);
}

// Update or add user location marker with 150km radius
export function showUserLocation(lat, lng) {
    if (!map) return;

    // Remove existing user marker and radius if any
    if (window.userMarker) {
        map.removeLayer(window.userMarker);
    }
    if (window.userRadius) {
        map.removeLayer(window.userRadius);
    }

    // Add 150km radius circle
    window.userRadius = L.circle([lat, lng], {
        radius: 150000, // 150km in meters
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.06,
        weight: 2,
        dashArray: '10, 5'
    }).addTo(map);

    // Blue pulsing user location marker
    const icon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-marker-inner"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    window.userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
    window.userMarker.bindPopup("📍 Ihr Standort");

    // Center map on user with appropriate zoom to show radius
    map.setView([lat, lng], 8);
}

export function updateMap(resorts) {
    if (!map) return;
    map.invalidateSize();

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    resorts.forEach(resort => {
        if (!resort.latitude || !resort.longitude) return;

        // Determine Status Class
        let statusClass = 'is-closed'; // Default
        if (resort.status === 'live' || resort.status === 'ok') {
            statusClass = 'is-live';
        } else if (resort.status === 'static_only') {
            statusClass = 'is-static';
        } else if (resort.status === 'error') {
            statusClass = 'is-error';
        }

        // Determine Icon based on domain
        let emoji = '⛷️';
        if (resort.domain === 'sled') emoji = '🛷';
        else if (resort.domain === 'skitour') emoji = '🏔️';
        else if (resort.domain === 'skate') emoji = '⛸️';
        else if (resort.domain === 'walk') emoji = '🚶';

        // Custom Marker Icon
        const icon = L.divIcon({
            className: 'custom-map-marker',
            html: `
                <div class="marker-pin ${statusClass}"></div>
                <div class="marker-icon">${emoji}</div>
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -35]
        });

        const marker = L.marker([resort.latitude, resort.longitude], { icon: icon }).addTo(map);

        // Enhanced Popup Content with Robust Checks
        let trafficInfo = 'N/A';
        if (resort.traffic) {
            const mins = resort.traffic.duration_min || Math.round((resort.traffic.duration || 0) / 60);
            trafficInfo = `${mins} min`;
        } else if (resort.distance) {
            // Fallback to static distance (stored as seconds in resort.distance)
            trafficInfo = `~${Math.round(resort.distance / 60)} min`;
        }

        // Snow: Handle Object vs String
        let snowInfo = 'N/A';
        if (resort.snow) {
            if (typeof resort.snow === 'object') {
                const depth = resort.snow.mountain ?? resort.snow.valley ?? 0;
                snowInfo = `${depth} cm`;
            } else {
                snowInfo = resort.snow;
            }
        }

        // Lifts: Handle missing liftsTotal and missing live data
        const total = resort.liftsTotal || resort.lifts || 0;
        const open = resort.liftsOpen; // Might be null
        let liftsInfo = 'N/A';

        if (total > 0) {
            if (open !== null && open !== undefined) {
                liftsInfo = `${open}/${total}`;
            } else {
                liftsInfo = `?/${total}`;
            }
        }

        // Weather: Extract emoji, description, and temperature
        let weatherEmoji = '🌤️';
        let weatherDesc = '-';
        let tempInfo = '';
        if (resort.weather) {
            if (typeof resort.weather === 'object') {
                weatherEmoji = resort.weather.icon || '🌤️';
                weatherDesc = resort.weather.desc || resort.weather.weather || '-';
                if (resort.weather.temp !== undefined) {
                    tempInfo = `${resort.weather.temp}°C`;
                }
            } else if (typeof resort.weather === 'string') {
                // Parse "☀️ Klar" format
                const match = resort.weather.match(/^([^\s]+)\s+(.+)$/);
                if (match) {
                    weatherEmoji = match[1];
                    weatherDesc = match[2];
                } else {
                    weatherDesc = resort.weather;
                }
            }
        }

        const popupContent = `
            <div class="map-popup-content">
                <div class="map-popup-header">${resort.name}</div>
                
                <div class="map-popup-grid">
                    <div class="map-popup-item" title="Geöffnete Lifte">
                        <span>🚡</span> <strong>${liftsInfo}</strong>
                    </div>
                    <div class="map-popup-item" title="Schneehöhe">
                        <span>❄️</span> <strong>${snowInfo}</strong>
                    </div>
                    <div class="map-popup-item" title="Anreisezeit">
                        <span>🚗</span> <strong>${trafficInfo}</strong>
                    </div>
                    <div class="map-popup-item" title="Wetter">
                        <strong>${weatherEmoji} ${tempInfo || weatherDesc}</strong>
                    </div>
                </div>

                <div class="map-popup-actions">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${resort.latitude},${resort.longitude}" 
                       target="_blank" class="map-btn map-btn-primary">
                       Google Maps
                    </a>
                    <a href="${resort.website}" target="_blank" class="map-btn map-btn-secondary">
                        Website
                    </a>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}
