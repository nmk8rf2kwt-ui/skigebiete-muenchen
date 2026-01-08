import { API_BASE_URL } from "./config.js";
import { escapeHtml } from "./utils.js";

/**
 * Modal State
 */
let currentResortId = null;
let currentTrafficChartLoaded = false;
let historyChart = null;
let resortTrafficChartInstance = null;
let detailsHistoryChart = null;

export function setCurrentResortId(id) {
    currentResortId = id;
}

export function getCurrentResortId() {
    return currentResortId;
}

/**
 * System Status Modal
 */
export async function fetchSystemStatus() {
    try {
        const res = await fetch(`${API_BASE_URL}/status`);
        if (!res.ok) throw new Error("Status API failed");
        const data = await res.json();
        renderStatusDashboard(data);
    } catch (err) {
        console.error("Status error:", err);
    }
}

export function renderStatusDashboard(data) {
    // Database
    const dbEl = document.getElementById("statusDatabase");
    const dbSizeEl = document.getElementById("statusDatabaseSize");
    const dbOk = data.database?.connected;
    if (dbEl) {
        dbEl.textContent = dbOk ? "🟢 Online" : "🔴 Offline";
        dbEl.style.color = dbOk ? "green" : "red";
        if (!dbOk) dbEl.title = data.database?.message || "Unknown error";
    }

    // Show database size metrics if available
    if (dbSizeEl) {
        if (data.metrics && data.metrics.db_size_mb > 0) {
            const sizeMB = data.metrics.db_size_mb.toFixed(1);
            const percentUsed = data.metrics.db_percent_used.toFixed(1);
            let color = "#27ae60"; // Green

            if (percentUsed >= 90) {
                color = "#e74c3c"; // Red
            } else if (percentUsed >= 80) {
                color = "#f39c12"; // Orange
            }

            dbSizeEl.textContent = `${sizeMB} MB (${percentUsed}%)`;
            dbSizeEl.style.color = color;
        } else {
            dbSizeEl.textContent = "Größe wird ermittelt...";
            dbSizeEl.style.color = "#95a5a6";
        }
    }

    // Scraper
    const scraperEl = document.getElementById("statusScraper");
    if (scraperEl) {
        const scraperStatus = data.components?.scraper || 'unknown';
        if (scraperStatus === 'healthy') {
            scraperEl.textContent = "🟢 Active";
            scraperEl.style.color = "green";
        } else if (scraperStatus === 'degraded') {
            scraperEl.textContent = "🟡 Degraded";
            scraperEl.style.color = "orange";
        } else {
            scraperEl.textContent = "⚪ Checking...";
            scraperEl.style.color = "gray";
        }
    }

    // Weather API
    const weatherEl = document.getElementById("statusWeather");
    if (weatherEl) {
        const weatherStatus = data.components?.weather || 'unknown';
        if (weatherStatus === 'healthy') {
            weatherEl.textContent = "🟢 Active";
            weatherEl.style.color = "green";
        } else if (weatherStatus === 'degraded') {
            weatherEl.textContent = "🟡 Degraded";
            weatherEl.style.color = "orange";
        } else {
            weatherEl.textContent = "⚪ Checking...";
            weatherEl.style.color = "gray";
        }
    }

    // Scheduler
    const schedulerEl = document.getElementById("statusScheduler");
    if (schedulerEl) {
        const schedulerStatus = data.components?.scheduler || 'unknown';
        if (schedulerStatus === 'healthy') {
            schedulerEl.textContent = "🟢 Running";
            schedulerEl.style.color = "green";
        } else if (schedulerStatus === 'degraded') {
            schedulerEl.textContent = "🟡 Degraded";
            schedulerEl.style.color = "orange";
        } else {
            schedulerEl.textContent = "⚪ Checking...";
            schedulerEl.style.color = "gray";
        }
    }

    // Traffic API (TomTom)
    const trafficEl = document.getElementById("statusTraffic");
    if (trafficEl) {
        const trafficStatus = data.components?.traffic || 'unknown';
        if (trafficStatus === 'healthy') {
            trafficEl.textContent = "🟢 Active";
            trafficEl.style.color = "green";
        } else if (trafficStatus === 'degraded') {
            trafficEl.textContent = "🟡 Degraded";
            trafficEl.style.color = "orange";
        } else {
            trafficEl.textContent = "⚪ Checking...";
            trafficEl.style.color = "gray";
        }
    }

    // Geocoding (OpenRouteService)
    const geocodingEl = document.getElementById("statusGeocoding");
    if (geocodingEl) {
        const geocodingStatus = data.components?.geocoding || 'unknown';
        if (geocodingStatus === 'healthy') {
            geocodingEl.textContent = "🟢 Active";
            geocodingEl.style.color = "green";
        } else if (geocodingStatus === 'degraded') {
            geocodingEl.textContent = "🟡 Degraded";
            geocodingEl.style.color = "orange";
        } else {
            geocodingEl.textContent = "⚪ On-Demand";
            geocodingEl.style.color = "gray";
        }
    }

    // Monitoring (Sentry)
    const monitoringEl = document.getElementById("statusMonitoring");
    if (monitoringEl) {
        const sentryActive = data.monitoring?.sentry || false;
        if (sentryActive) {
            monitoringEl.textContent = "🛡️ Aktiv";
            monitoringEl.style.color = "green";
        } else {
            monitoringEl.textContent = "⚠️ Inaktiv";
            monitoringEl.style.color = "orange";
        }
    }

    // Webcams
    const webcamEl = document.getElementById("statusWebcams");
    if (webcamEl) {
        const webcamData = data.webcams;
        if (webcamData && webcamData.summary) {
            const { ok, total, error } = webcamData.summary;
            if (error === 0 && ok > 0) {
                webcamEl.textContent = `🟢 ${ok}/${total} OK`;
                webcamEl.style.color = "green";
            } else if (error > 0) {
                webcamEl.textContent = `⚠️ ${error} Errors (${ok} OK)`;
                webcamEl.style.color = "orange";
            } else {
                webcamEl.textContent = "⚪ No Data";
                webcamEl.style.color = "gray";
            }
            if (webcamData.summary.lastCheck) {
                webcamEl.title = `Last Check: ${new Date(webcamData.summary.lastCheck).toLocaleTimeString()}`;
            }
        } else {
            webcamEl.textContent = "⚪ Unknown";
            webcamEl.style.color = "gray";
        }
    }

    // Traffic Analysis (Data Collection)
    const trafficAnalysisEl = document.getElementById("statusTrafficAnalysis");
    const trafficMetricsEl = document.getElementById("statusTrafficMetrics");
    if (trafficAnalysisEl) {
        const trafficAnalysisStatus = data.components?.traffic_analysis || 'unknown';

        if (trafficAnalysisStatus === 'healthy') {
            trafficAnalysisEl.textContent = "🟢 Collecting";
            trafficAnalysisEl.style.color = "green";

            // Show metrics if available
            if (data.metrics && trafficMetricsEl) {
                const dataPoints = data.metrics.traffic_data_points || 0;
                const lastUpdate = data.metrics.traffic_last_update
                    ? new Date(data.metrics.traffic_last_update).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                trafficMetricsEl.textContent = `${dataPoints} Einträge | ${lastUpdate}`;
                trafficMetricsEl.style.color = "#27ae60";
            }
        } else if (trafficAnalysisStatus === 'degraded') {
            trafficAnalysisEl.textContent = "🟡 Issues";
            trafficAnalysisEl.style.color = "orange";
            if (trafficMetricsEl) {
                trafficMetricsEl.textContent = "Datensammlung unterbrochen";
                trafficMetricsEl.style.color = "#f39c12";
            }
        } else {
            trafficAnalysisEl.textContent = "⚪ Initializing";
            trafficAnalysisEl.style.color = "gray";
            if (trafficMetricsEl) {
                trafficMetricsEl.textContent = "Warte auf erste Daten...";
                trafficMetricsEl.style.color = "#95a5a6";
            }
        }
    }

    // Uptime
    const uptimeEl = document.getElementById("statusUptime");
    if (uptimeEl) {
        const uptime = Math.floor(data.uptime || 0);
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        uptimeEl.textContent = `${hours}h ${mins}m`;
    }

    // Logs
    const logContainer = document.getElementById("systemLogs");
    if (logContainer) {
        if (data.logs && data.logs.length > 0) {
            logContainer.innerHTML = data.logs.map(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                let color = "#333";
                if (log.level === 'error') color = "#d32f2f";
                if (log.level === 'warn') color = "#f57c00";
                if (log.level === 'success') color = "#43a047";

                let icon = "ℹ️";
                if (log.level === 'error') icon = "❌";
                if (log.level === 'warn') icon = "⚠️";
                if (log.level === 'success') icon = "✅";

                return `<div class="log-entry" style="border-bottom: 1px solid #eee; padding: 4px 0; font-family: monospace; font-size: 0.9em; color: ${color};">
                    <span style="color: #999;">[${time}]</span> ${icon} <strong>[${log.component.toUpperCase()}]</strong> ${log.message}
                </div>`;
            }).join("");
        } else {
            logContainer.innerHTML = "<div class='log-entry'>No logs available</div>";
        }
    }
}

/**
 * History Modal
 */
export function displayHistoryChart(history) {
    const ctx = document.getElementById("historyChart");
    if (!ctx) return;

    if (!history || history.length === 0) {
        ctx.parentElement.innerHTML = "<p>No historical data available yet. Data is collected daily starting from today.</p>";
        return;
    }

    // Destroy previous chart if exists
    if (historyChart) {
        historyChart.destroy();
    }

    const dates = history.map(h => {
        const date = new Date(h.date);
        return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    });

    const snowData = history.map(h => parseInt(h.snow) || null);
    const liftsData = history.map(h => h.liftsOpen || null);

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Snow Depth (cm)',
                    data: snowData,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3
                },
                {
                    label: 'Lifts Open',
                    data: liftsData,
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Snow Depth (cm)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Lifts Open'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            }
        }
    });
}

export async function switchHistoryTab(tab) {
    // Toggle active classes
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.history-tabs [data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Toggle content visibility
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const targetContent = document.getElementById(`${tab}Tab`);
    if (targetContent) targetContent.style.display = 'block';

    // Load content
    if (tab === 'traffic' && !currentTrafficChartLoaded && currentResortId) {
        loadResortTrafficHistory(currentResortId);
    } else if (tab === 'weather' && currentResortId) {
        const { createCombinedWeatherChart } = await import('./weatherChart.js');
        createCombinedWeatherChart("weatherChartsContainer", currentResortId, 30);
    }
}

export async function loadResortTrafficHistory(resortId) {
    // Determine nearest city based on user location
    const userLat = window.userLocation?.latitude || 48.1351; // Munich default
    const userLon = window.userLocation?.longitude || 11.5820;

    const nearestCity = findNearestCity(userLat, userLon);

    try {
        const res = await fetch(`${API_BASE_URL}/api/history/traffic/${nearestCity}/${resortId}`);
        if (!res.ok) throw new Error('Failed to fetch traffic history');

        const response = await res.json();
        renderResortTrafficChart(response.data, resortId, nearestCity);
        currentTrafficChartLoaded = true;
    } catch (error) {
        console.error('Traffic history error:', error);
        const ctx = document.getElementById('trafficHistoryChart');
        if (ctx) {
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
        }
    }
}

export function renderResortTrafficChart(data, resortId, cityId) {
    const ctx = document.getElementById('trafficHistoryChart');
    if (!ctx) return;

    if (resortTrafficChartInstance) {
        resortTrafficChartInstance.destroy();
    }

    if (!data || data.length === 0) {
        console.log('No traffic data available for', resortId);
        return;
    }

    // Aggregate data by day-of-week and hour
    const weeklyData = aggregateWeeklyTraffic(data);
    const labels = generateWeekLabels();

    resortTrafficChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Ø Verzögerung ab ${getCityName(cityId)} (min)`,
                data: weeklyData,
                backgroundColor: weeklyData.map(delay => getTrafficColor(delay)),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Verzögerung (Minuten)' }
                },
                x: {
                    title: { display: true, text: 'Wochentag / Uhrzeit' },
                    ticks: {
                        maxRotation: 90,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            }
        }
    });
}

/**
 * Traffic Helpers
 */
export function aggregateWeeklyTraffic(data) {
    const grid = Array(7).fill(null).map(() => Array(24).fill(null).map(() => []));

    data.forEach(entry => {
        const date = new Date(entry.timestamp);
        const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        const hour = date.getHours();
        const adjustedDay = day === 0 ? 6 : day - 1; // Convert to Mo=0, So=6

        grid[adjustedDay][hour].push(entry.delay);
    });

    const weeklyData = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const delays = grid[day][hour];
            const avg = delays.length > 0
                ? delays.reduce((sum, d) => sum + d, 0) / delays.length
                : 0;
            weeklyData.push(Math.round(avg));
        }
    }

    return weeklyData;
}

export function generateWeekLabels() {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const labels = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            labels.push(`${days[day]} ${hour.toString().padStart(2, '0')}:00`);
        }
    }

    return labels;
}

export function getTrafficColor(delay) {
    if (delay > 20) return 'rgba(231, 76, 60, 0.8)'; // Red
    if (delay > 10) return 'rgba(243, 156, 18, 0.8)'; // Orange
    if (delay > 5) return 'rgba(241, 196, 15, 0.8)'; // Yellow
    return 'rgba(46, 204, 113, 0.8)'; // Green
}

export function getCityName(cityId) {
    const cityNames = {
        'munich': 'München',
        'augsburg': 'Augsburg',
        'salzburg': 'Salzburg'
    };
    return cityNames[cityId] || cityId;
}

export function findNearestCity(lat, lon) {
    const cities = [
        { id: 'munich', lat: 48.1351, lon: 11.5820 },
        { id: 'augsburg', lat: 48.3705, lon: 10.8978 },
        { id: 'salzburg', lat: 47.8095, lon: 13.0550 }
    ];

    let nearest = cities[0];
    let minDist = Infinity;

    cities.forEach(city => {
        const dist = Math.sqrt(
            Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = city;
        }
    });

    return nearest.id;
}

/**
 * Weather Modal
 */
export function displayWeather(forecast) {
    const container = document.getElementById("weatherForecast");
    if (!container) return;

    if (!forecast || forecast.length === 0) {
        container.innerHTML = "<p>No forecast data available</p>";
        return;
    }

    const html = forecast.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

        return `
      <div class="weather-day">
        <div class="date">${dayName}</div>
        <div class="emoji">${day.weatherEmoji}</div>
        <div class="desc">${day.weatherDesc}</div>
        <div class="temp">
          <span class="temp-max">${day.tempMax}°</span> /
          <span class="temp-min">${day.tempMin}°</span>
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = html;
}

/**
 * Resort Details Modal
 */
export function displayResortDetails(resort) {
    const container = document.getElementById("detailsContent");
    if (!container) return;
    const safeResortName = escapeHtml(resort.name);

    container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Lade Details für ${safeResortName}...</p>
    </div>
  `;

    setTimeout(() => {
        if (!resort.lifts && !resort.slopes) {
            container.innerHTML = "<p>Keine detaillierten Daten verfügbar</p>";
            return;
        }

        let html = "";



        // Create Flex Container for Layout
        html += `<div style="display: flex; flex-wrap: wrap; gap: 20px;">`;

        // Lifts Section
        if (resort.lifts && resort.lifts.length > 0) {
            html += `<div class="details-section" style="flex: 1; min-width: 300px;">
      <h3>🚡 Lifte (${resort.liftsOpen || 0}/${resort.liftsTotal || resort.lifts.length})</h3>
      <div class="facilities-list" style="max-height: 400px; overflow-y: auto;">`;

            resort.lifts.forEach(lift => {
                const statusClass = lift.status === "open" ? "status-open" :
                    lift.status === "closed" ? "status-closed" : "status-unknown";
                const statusIcon = lift.status === "open" ? "🟢" :
                    lift.status === "closed" ? "🔴" : "⚪";

                const safeLiftName = escapeHtml(lift.name);

                html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          <span class="facility-name">${safeLiftName}</span>
        </div>`;

                // Metadata
                const metadata = [];
                if (lift.type) metadata.push(`Typ: ${escapeHtml(lift.type)}`);
                if (lift.length) metadata.push(`Länge: ${lift.length}m`);
                if (lift.altitudeStart) metadata.push(`Höhe: ${lift.altitudeStart}m`);
                if (lift.operatingHours) metadata.push(`⏰ ${escapeHtml(lift.operatingHours)}`);

                if (metadata.length > 0) {
                    html += `<div class="facility-meta">${metadata.join(' • ')}</div>`;
                }

                html += `</div>`;
            });

            html += `</div></div>`;
        }

        // Slopes Section
        if (resort.slopes && resort.slopes.length > 0) {
            const slopesOpen = resort.slopes.filter(s => s.status === "open").length;
            html += `<div class="details-section" style="flex: 1; min-width: 300px;">
      <h3>⛷️ Pisten (${slopesOpen}/${resort.slopes.length})</h3>
      <div class="facilities-list" style="max-height: 400px; overflow-y: auto;">`;

            resort.slopes.forEach(slope => {
                const statusClass = slope.status === "open" ? "status-open" :
                    slope.status === "closed" ? "status-closed" : "status-unknown";
                const statusIcon = slope.status === "open" ? "🟢" :
                    slope.status === "closed" ? "🔴" : "⚪";

                const difficultyIcon = slope.difficulty === "blue" ? "🔵" :
                    slope.difficulty === "red" ? "🔴" :
                        slope.difficulty === "black" ? "⚫" :
                            slope.difficulty === "freeride" ? "🟠" : "";

                const safeSlopeName = escapeHtml(slope.name);

                html += `<div class="facility-item">
        <div class="facility-header">
          <span class="facility-status ${statusClass}">${statusIcon}</span>
          ${difficultyIcon ? `<span class="difficulty-badge">${difficultyIcon}</span>` : ''}
          <span class="facility-name">${safeSlopeName}</span>
        </div>`;

                // Metadata
                const metadata = [];
                if (slope.difficulty) metadata.push(`Schwierigkeit: ${escapeHtml(slope.difficulty)}`);
                if (slope.length) metadata.push(`Länge: ${slope.length}m`);
                if (slope.altitudeStart) metadata.push(`Höhe: ${slope.altitudeStart}m`);
                if (slope.operatingHours) metadata.push(`⏰ ${escapeHtml(slope.operatingHours)}`);

                if (metadata.length > 0) {
                    html += `<div class="facility-meta">${metadata.join(' • ')}</div>`;
                }

                html += `</div>`;
            });

            html += `</div></div>`;
        }

        html += `</div>`; // End Flex Container

        container.innerHTML = html;
    }, 100);
}

export async function fetchDetailsHistory(resortId) {
    const statusEl = document.getElementById("detailsHistoryStatus");
    if (!statusEl) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/history/${resortId}?days=7`);
        if (!res.ok) throw new Error("Failed to fetch history");

        const data = await res.json();

        if (!data.history || data.history.length === 0) {
            statusEl.textContent = "Keine Verlaufsdaten verfügbar (Daten werden täglich gesammelt)";
            return;
        }

        // Destroy previous chart
        if (detailsHistoryChart) {
            detailsHistoryChart.destroy();
        }

        const ctx = document.getElementById("detailsHistoryChart");
        if (!ctx) return;

        const dates = data.history.map(h => {
            const date = new Date(h.date);
            return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
        });

        const liftsData = data.history.map(h => h.liftsOpen || null);

        detailsHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Geöffnete Lifte',
                    data: liftsData,
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        statusEl.style.display = "none";
    } catch (error) {
        console.error("History error:", error);
        statusEl.textContent = "Verlaufsdaten noch nicht verfügbar";
    }
}

export function resetModalStates() {
    currentTrafficChartLoaded = false;
}
