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

    // Add 150km radius circle (initial default)
    window.userRadius = L.circle([lat, lng], {
        radius: 150000,
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

        // Determine Icon based on domain
        let emoji = '⛷️';
        if (resort.domain === 'sled') emoji = '🛷';
        else if (resort.domain === 'skitour') emoji = '🏔️';
        else if (resort.domain === 'skate') emoji = '⛸️';
        else if (resort.domain === 'walk') emoji = '🚶';

        // Gradient & Score Styling
        const score = resort.smartScore || 0;
        const hue = Math.max(0, Math.min(120, score * 1.2)); // 0 (Red) -> 120 (Green)
        const bgColor = `hsl(${hue}, 70%, 50%)`;
        const shadowColor = `hsl(${hue}, 70%, 30%)`;

        // "Wow" Marker: Gradient Pill
        const icon = L.divIcon({
            className: 'custom-map-marker',
            html: `
                <div class="wow-marker" style="background: linear-gradient(135deg, ${bgColor}, ${shadowColor}); box-shadow: 0 4px 10px ${shadowColor}80;">
                    <div class="marker-score">${score}</div>
                    <div class="marker-emoji">${emoji}</div>
                </div>
            `,
            iconSize: [40, 40], // Larger
            iconAnchor: [20, 20],
            popupAnchor: [0, -25]
        });

        const marker = L.marker([resort.latitude, resort.longitude], { icon: icon, smartScore: score }).addTo(map);

        // Enhanced Popup Content with Robust Checks
        let trafficInfo = 'N/A';
        if (resort.traffic) {
            const mins = resort.traffic.duration_min || Math.round((resort.traffic.duration || 0) / 60);
            trafficInfo = `${mins} min`;
        } else if (resort.staticDuration) {
            trafficInfo = `~${resort.staticDuration} min`; // Tilde for static
        } else if (resort.distance) {
            // Fallback if distance is minutes (normalized in app.js)
            trafficInfo = `~${resort.distance} min`;
        }

        // Snow Info
        let snowInfo = 'N/A';
        if (resort.snow) {
            if (typeof resort.snow === 'object') {
                snowInfo = `${resort.snow.mountain ?? resort.snow.valley ?? '?'} cm`;
            } else {
                snowInfo = resort.snow;
            }
        }

        const popupContent = `
            <div class="map-popup">
                <h3>${resort.name}</h3>
                <div class="popup-meta">
                    <span>🚗 ${trafficInfo}</span>
                    <span>❄️ ${snowInfo}</span>
                </div>
                <div class="popup-score" style="color:${bgColor}">Score: ${score}</div>
                <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${resort.latitude},${resort.longitude}')">Route ➔</button>
            </div>
        `;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Auto-Zoom: Fits bounds of all markers by default, 
    // OR prioritize "Top 10" if requested. 
    // User requested "Zoomstufe wo mind. 10 pins erscheinen".
    // If we fit bounds of Top 10, we ensure the best are visible.

    if (markers.length > 0) {
        // Sort markers by score descending to find Top 10
        const sortedMarkers = markers.slice().sort((a, b) => (b.options.smartScore || 0) - (a.options.smartScore || 0));
        const top10 = sortedMarkers.slice(0, 10); // Take top 10

        // Create feature group of top 10 to get bounds
        const group = new L.featureGroup(top10.length > 0 ? top10 : markers);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

// Distance Filter Logic
export function setMapDistance(km) {
    if (!map || !window.userMarker) return;
    const userLatLng = window.userMarker.getLatLng();

    // Update Radius Circle
    if (window.userRadius) map.removeLayer(window.userRadius);
    window.userRadius = L.circle(userLatLng, {
        radius: km * 1000,
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '5, 5'
    }).addTo(map);

    // Filter Markers visually
    const group = new L.featureGroup();
    let count = 0;
    markers.forEach(m => {
        const dist = m.getLatLng().distanceTo(userLatLng);
        if (dist <= km * 1000) {
            map.addLayer(m);
            group.addLayer(m);
            count++;
        } else {
            map.removeLayer(m);
        }
    });

    // Zoom to fit filtered if > 0
    if (count > 0) {
        // Limit zoom to avoid too close
        map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 10 });
    }
}
