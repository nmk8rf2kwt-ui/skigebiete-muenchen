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

// Update or add user location marker
export function showUserLocation(lat, lng) {
    if (!map) return;

    // Remove existing user marker if any (we should track it but for now let's just add new one or relying on map clearnup)
    // To do it properly, let's add a global variable for it
    if (window.userMarker) {
        map.removeLayer(window.userMarker);
    }

    const icon = L.divIcon({
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    window.userMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
    window.userMarker.bindPopup("Ihr Standort").openPopup();

    // Zoom to fit user and resorts? Or just pan?
    // map.setView([lat, lng], 10);
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

        // Enhanced Popup Content
        const trafficInfo = resort.traffic
            ? `${resort.traffic.duration_min || Math.round(resort.traffic.duration / 60)} min`
            : (resort.distance ? `${resort.distance} min` : 'N/A');

        const snowInfo = resort.snow || 'N/A';
        const liftsInfo = resort.liftsTotal ? `${resort.liftsOpen || 0}/${resort.liftsTotal}` : 'N/A';
        const weatherInfo = resort.weather || 'Unknown';

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
                        <span>🌤️</span> <strong>${weatherInfo}</strong>
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
