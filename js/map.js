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

        // Determine Color based on status (matching table column 1)
        let color = 'gray'; // Default
        if (resort.status === 'live' || resort.status === 'ok') {
            color = 'green'; // 🟢 Live data
        } else if (resort.status === 'static_only') {
            color = 'orange'; // 🟡 Static only
        } else if (resort.status === 'error') {
            color = 'red'; // 🔴 Error
        }

        // Custom Icon (Circle Marker with white border)
        const marker = L.circleMarker([resort.latitude, resort.longitude], {
            color: 'white',
            fillColor: color,
            fillOpacity: 0.9,
            radius: 8,
            weight: 2
        }).addTo(map);

        // Popup Content
        const trafficInfo = resort.traffic
            ? `<br>🚗 Traffic: ${resort.traffic.duration} min`
            : (resort.distance ? `<br>🚗 Dist: ${resort.distance} min` : '');

        const snowInfo = resort.snow ? `<br>❄️ Snow: ${resort.snow}` : '';
        const liftsInfo = resort.liftsTotal ? `<br>🚡 Lifts: ${resort.liftsOpen || 0}/${resort.liftsTotal}` : '';

        const popupContent = `
      <strong>${resort.name}</strong>
      ${liftsInfo}
      ${snowInfo}
      ${trafficInfo}
      <br><a href="${resort.website}" target="_blank">Website</a>
    `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}
