// Configuration for frontend API endpoints
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:10000'
    : 'https://skigebiete-muenchen-backend.onrender.com';

export { API_BASE_URL };
