// Environment-aware API configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'  // Local development (using 3000 to avoid port 10000 conflicts)
    : 'https://skigebiete-muenchen-backend.onrender.com/api';  // Production
