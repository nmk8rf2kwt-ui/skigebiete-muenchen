/**
 * Weather Chart Module
 * Creates interactive charts for historical weather data visualization
 */

/**
 * Create a temperature trend chart (line chart)
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Weather data array
 */
export function createTemperatureChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas ${canvasId} not found`);
        return null;
    }

    const ctx = canvas.getContext('2d');

    // Extract dates and temperatures
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const maxTemps = data.map(d => d.tempMax);
    const minTemps = data.map(d => d.tempMin);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tagesmax (°C)',
                    data: maxTemps,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Tagesmin (°C)',
                    data: minTemps,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperaturverlauf',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}°C`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperatur (°C)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    return chart;
}

/**
 * Create a snowfall chart (bar chart)
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Weather data array
 */
export function createSnowfallChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas ${canvasId} not found`);
        return null;
    }

    const ctx = canvas.getContext('2d');

    // Extract dates and snowfall
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const snowfallData = data.map(d => {
        // Convert mm to cm (Open-Meteo returns snowfall in mm)
        return d.snowfall ? (d.snowfall / 10).toFixed(1) : 0;
    });

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Neuschnee (cm)',
                    data: snowfallData,
                    backgroundColor: snowfallData.map(val => {
                        // Color gradient based on amount
                        if (val > 20) return 'rgba(52, 152, 219, 0.9)'; // Heavy snow
                        if (val > 10) return 'rgba(52, 152, 219, 0.7)'; // Moderate
                        if (val > 5) return 'rgba(52, 152, 219, 0.5)';  // Light
                        if (val > 0) return 'rgba(52, 152, 219, 0.3)';  // Trace
                        return 'rgba(189, 195, 199, 0.2)';              // None
                    }),
                    borderColor: '#3498db',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Täglicher Schneefall',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.y;
                            if (value === 0) return 'Kein Schneefall';
                            return `Neuschnee: ${value} cm`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Schneefall (cm)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    return chart;
}

/**
 * Create combined weather charts in a container
 * @param {string} containerId - Container element ID
 * @param {string} resortId - Resort ID
 * @param {number} days - Number of days to display
 */
export async function createCombinedWeatherChart(containerId, resortId, days = 30) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    // Show loading spinner
    container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 20px; color: #7f8c8d;">Lade Wetterdaten...</p>
        </div>
    `;

    try {
        // Fetch weather data
        const response = await fetch(`/api/historical-weather/${resortId}?days=${days}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <p>⚠️ Keine Wetterdaten verfügbar</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        Historische Wetterdaten werden täglich erfasst.<br>
                        Bitte versuchen Sie es später erneut.
                    </p>
                </div>
            `;
            return;
        }

        // Create chart containers
        container.innerHTML = `
            <div style="margin-bottom: 30px;">
                <canvas id="temp-chart-${resortId}" style="height: 250px;"></canvas>
            </div>
            <div>
                <canvas id="snow-chart-${resortId}" style="height: 250px;"></canvas>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #555;">
                <strong>ℹ️ Datenquelle:</strong> Open-Meteo Historical Weather API<br>
                <strong>📊 Zeitraum:</strong> ${result.data.length} Tage (${new Date(result.data[0].date).toLocaleDateString('de-DE')} - ${new Date(result.data[result.data.length - 1].date).toLocaleDateString('de-DE')})
            </div>
        `;

        // Create charts
        createTemperatureChart(`temp-chart-${resortId}`, result.data);
        createSnowfallChart(`snow-chart-${resortId}`, result.data);

    } catch (error) {
        console.error('Error loading weather charts:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <p>❌ Fehler beim Laden der Wetterdaten</p>
                <p style="font-size: 0.9em; margin-top: 10px; color: #7f8c8d;">
                    ${error.message}
                </p>
            </div>
        `;
    }
}
