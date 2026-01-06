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

export function updateMap(resorts) {
    if (!map) return;

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    resorts.forEach(resort => {
        if (!resort.latitude || !resort.longitude) return;

        // Determine Color
        let color = 'blue';
        if (resort.status === 'live') {
            if ((resort.liftsOpen || 0) > 0) color = 'green';
            else if (resort.liftsOpen === 0) color = 'red'; // likely closed
        } else if (resort.status === 'static_only' || !resort.status) {
            color = 'gold';
        } else if (resort.status === 'error') {
            color = 'grey';
        }

        // Custom Icon (Simple Circle Marker)
        const marker = L.circleMarker([resort.latitude, resort.longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 10
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
