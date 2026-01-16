
// Pool of realistic User-Agents from different browsers and versions
const USER_AGENTS = [
    // Chrome (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",

    // Chrome (Mac)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",

    // Firefox (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",

    // Firefox (Mac)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",

    // Safari (Mac)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",

    // Edge (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
];

/**
 * Get a random User-Agent from the pool
 */
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Add a random delay to mimic human behavior
 * @param {number} min - Minimum delay in milliseconds (default: 500)
 * @param {number} max - Maximum delay in milliseconds (default: 2000)
 */
async function randomDelay(min = 500, max = 2000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Fetch with retry logic and exponential backoff
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retry attempts (default: 2, reduced from 3)
 */
async function fetchWithRetry(url, options = {}, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Add random delay before each request (except first attempt)
            if (attempt > 0) {
                const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Exponential backoff, max 8s
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${url}`);
            } else {
                // Random delay for first request (500ms-2s)
                await randomDelay(500, 2000);
            }

            const response = await fetch(url, options);

            // If response is ok, return it
            if (response.ok) {
                return response;
            }

            // Handle specific HTTP errors
            if (response.status === 429) {
                // Rate limited - wait longer
                console.warn(`⚠️ Rate limited (429) for ${url}, waiting before retry...`);
                lastError = new Error(`Rate limited: ${response.status}`);
                continue;
            }

            if (response.status >= 500) {
                // Server error - retry
                console.warn(`⚠️ Server error (${response.status}) for ${url}, retrying...`);
                lastError = new Error(`Server error: ${response.status}`);
                continue;
            }

            // Client error (4xx except 429) - don't retry
            if (response.status >= 400 && response.status < 500) {
                console.error(`❌ Client error (${response.status}) for ${url}, not retrying`);
                return response; // Return the error response
            }

            // Other non-ok responses
            lastError = new Error(`HTTP ${response.status}`);

        } catch (error) {
            lastError = error;
            console.error(`❌ Fetch error for ${url}:`, error.message);

            // Don't retry on timeout if it's the last attempt
            if (attempt === maxRetries) {
                break;
            }
        }
    }

    // All retries failed
    console.error(`❌ All ${maxRetries + 1} attempts failed for ${url}`);
    throw lastError || new Error('Fetch failed after retries');
}

/**
 * Enhanced fetch with anti-blocking mechanisms
 * - Rotating User-Agents
 * - Random delays (500ms-2s)
 * - Retry logic with exponential backoff
 * - Browser-like headers
 */
export async function fetchWithHeaders(url, options = {}) {
    const headers = {
        "User-Agent": getRandomUserAgent(), // Rotating User-Agent
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        ...options.headers
    };

    // Set default timeout if not provided (15 seconds, reduced from 30s for faster failure detection)
    const timeout = options.timeout || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetchWithRetry(url, {
            ...options,
            headers,
            signal: options.signal || controller.signal
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
