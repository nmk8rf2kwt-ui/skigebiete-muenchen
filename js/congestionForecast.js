import { API_BASE_URL } from './config.js';

/**
 * Fetch congestion forecast for a resort
 * @param {string} resortId - Resort ID
 * @returns {Promise<Object|null>} Congestion analysis or null
 */
export async function fetchCongestionForecast(resortId) {
  try {
    const response = await fetch(`${API_BASE_URL}/traffic-analysis/${resortId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Congestion forecast error:', error);
    return null;
  }
}

/**
 * Render congestion forecast cell
 * @param {Object} data - Resort data
 * @param {string} resortId - Resort ID
 * @returns {string} HTML for congestion cell
 */
export function renderCongestionCell(data, resortId) {
  const cellId = `congestion-${resortId}`;

  // Initial placeholder
  const placeholder = '<span style="color: #95a5a6; font-size: 0.9em;">⏳ Lädt...</span>';

  // Async load forecast
  setTimeout(() => loadCongestionForecast(resortId, cellId), 100);

  return `<td id="${cellId}" class="congestion-cell">${placeholder}</td>`;
}

/**
 * Load and display congestion forecast
 */
async function loadCongestionForecast(resortId, cellId) {
  const cell = document.getElementById(cellId);
  if (!cell) return;

  const analysis = await fetchCongestionForecast(resortId);

  if (!analysis || !analysis.hasData) {
    const progress = analysis?.currentDataPoints || 0;
    const total = analysis?.minDataPoints || 100;
    const percentage = Math.round((progress / total) * 100);

    cell.innerHTML = `
      <span style="color: #95a5a6; font-size: 0.9em;" title="Datensammlung: ${progress}/${total} Einträge">
        ⏳ ${percentage}%
      </span>
    `;
    return;
  }

  // Has data - render forecast
  const top5 = analysis.top5Congestion;
  const forecast = analysis.forecast || []; // Should be present from backend
  const avgDelay = analysis.summary.avgDelayTop5;

  // 1. Render Forecast Pills (Now, +1h, +2h)
  const pillsHtml = forecast.map((slot, index) => {
    // Label: "Jetzt", "+1h", "+2h" or "14:00"
    let label = slot.timeLabel;
    if (index === 0) label = "Jetzt";

    // Icon/Color logic
    let color = slot.color;
    if (color === '#e74c3c') color = '#c0392b'; // Darken red for contrast

    return `
      <div class="traffic-pill" style="border-left: 3px solid ${color};" title="${slot.timeLabel}: Ø ${slot.avgDelay} min Stau">
         <span class="time">${label}</span>
         <span class="delay" style="color: ${color}">${slot.avgDelay}'</span>
      </div>
    `;
  }).join('');


  // 2. Build compact tooltip content (Top 5 only)
  let tooltipLines = '';
  if (top5.length > 0) {
    tooltipLines = top5.map((slot, index) => {
      const shortDay = slot.weekdayName.substring(0, 2);
      return `
            <div class="tooltip-row">
            <span>${shortDay} ${slot.hourRange}</span>
            <span style="font-weight:bold;">${slot.avgDelay} min</span>
            </div>
        `;
    }).join('');
  } else {
    tooltipLines = `<div class="tooltip-row" style="color: #ccc; font-style: italic;">Keine nennenswerten Staus (< 5 min)</div>`;
  }

  cell.innerHTML = `
    <!-- Container for pills -->
    <div class="congestion-cell-content" style="position: relative; display: inline-block;">
        <div class="traffic-forecast-container">
            ${pillsHtml}
             <!-- Info Icon for Tooltip trigger -->
             <span class="info-icon" style="font-size: 0.8em; color: #95a5a6; cursor: help; margin-left: 2px;">ℹ️</span>
        </div>
      
        <!-- Tooltip -->
        <div class="congestion-tooltip">
            <div class="tooltip-header">
            📈 Top 5 Stauzeiten (Ø ${avgDelay}')
            </div>
            ${tooltipLines}
            <div class="tooltip-footer">
            Datenbasis: ${analysis.dataPoints} Messungen (${analysis.analyzedDays} d)
            </div>
        </div>
    </div>
  `;

  // Add hover listeners (Delegated to CSS mostly, but ensuring touch support or fallback)
  // The CSS .congestion-cell:hover .congestion-tooltip handles it for desktop.
}
