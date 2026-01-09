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
  const avgDelay = analysis.summary.avgDelayTop5;

  // Icon based on average delay
  let icon, color;
  if (avgDelay > 30) {
    icon = '🔴';
    color = '#e74c3c';
  } else if (avgDelay > 15) {
    icon = '🟡';
    color = '#f39c12';
  } else {
    icon = '🟢';
    color = '#27ae60';
  }

  // Build tooltip content
  const tooltipLines = top5.map((slot, index) => `
    <div style="padding: 4px 0; border-bottom: ${index < 4 ? '1px solid #eee' : 'none'};">
      <strong>${slot.weekdayName}</strong> ${slot.hourRange}<br>
      <span style="color: ${color};">Ø ${slot.avgDelay} min Stau</span>
      <span style="color: #7f8c8d; font-size: 0.85em;"> (${slot.occurrences}x gemessen)</span>
    </div>
  `).join('');

  cell.innerHTML = `
    <!-- Added history-btn class and data-resort-id for modal trigger -->
    <div class="congestion-forecast history-btn" data-resort-id="${resortId}" style="position: relative; cursor: pointer; display: inline-block;">
      <span style="font-size: 1.0em;">${icon}</span>
      <span style="font-size: 0.85em; color: ${color}; font-weight: 500;">${avgDelay} min</span>
      
      <div class="congestion-tooltip" style="
        display: none;
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        min-width: 240px;
        left: 50%;
        transform: translateX(-50%);
        bottom: 100%;
        margin-bottom: 8px;
        cursor: auto; 
      ">
        <div style="font-weight: bold; margin-bottom: 6px; color: #2c3e50; font-size: 0.9em;">
          🚦 Top 5 Stauzeiten (Ø ${avgDelay} min)
        </div>
        ${tooltipLines}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.85em; color: #7f8c8d;">
          Basierend auf ${analysis.dataPoints} Messungen über ${analysis.analyzedDays} Tage
          <br><strong>(Klicken für detailliertes Diagramm)</strong>
        </div>
      </div>
    </div>
  `;

  // Add hover listeners
  const forecast = cell.querySelector('.congestion-forecast');
  const tooltip = cell.querySelector('.congestion-tooltip');

  if (forecast && tooltip) {
    forecast.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });

    forecast.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    // Prevent click on tooltip from triggering modal if it overlaps (though styling puts it distinct)
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}
