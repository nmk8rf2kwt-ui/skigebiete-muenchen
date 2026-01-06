/**
 * Prevents XSS by escaping HTML special characters.
 * @param {string} unsafe - The string to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    if (typeof unsafe !== 'string') return String(unsafe);

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
