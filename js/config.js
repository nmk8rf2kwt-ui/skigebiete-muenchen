// Environment-aware API configuration
// On GitHub Pages (or any non-localhost), use the Render backend. Locally, use same origin.
const isProduction = window.location.hostname.includes('github.io') ||
    !window.location.hostname.includes('localhost');
export const API_BASE_URL = isProduction
    ? 'https://skigebiete-muenchen-backend.onrender.com'
    : window.location.origin;
