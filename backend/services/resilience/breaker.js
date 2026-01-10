import CircuitBreaker from 'opossum';
import logger from '../logger.js';

/**
 * Creates a configured Circuit Breaker for an async function.
 * @param {Function} asyncFunction - The function to wrap (must return a Promise)
 * @param {string} name - Name of the breaker for logging
 * @param {Object} options - Custom options to override defaults
 */
export function createBreaker(asyncFunction, name = 'Service', options = {}) {
    const defaultOptions = {
        timeout: 5000, // If function takes longer than 5s, trigger failure
        errorThresholdPercentage: 50, // If 50% of requests fail, open circuit
        resetTimeout: 30000, // Wait 30s before trying again
        scope: this
    };

    const breaker = new CircuitBreaker(asyncFunction, { ...defaultOptions, ...options });

    breaker.on('open', () => {
        logger.warn(`[Resilience] 🔌 Circuit Breaker OPEN: ${name} is unreachable. Skipping calls.`);
    });

    breaker.on('halfOpen', () => {
        logger.info(`[Resilience] ⚡ Circuit Breaker HALF-OPEN: ${name} testing connection...`);
    });

    breaker.on('close', () => {
        logger.info(`[Resilience] ✅ Circuit Breaker CLOSED: ${name} is back online.`);
    });

    breaker.fallback(() => {
        logger.warn(`[Resilience] 🛡️ Fallback triggered for ${name}`);
        return null; // Default fallback is null, can be overridden by caller handling
    });

    return breaker;
}
