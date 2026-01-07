/**
 * Sentry Configuration with Session Replay
 * 
 * This file configures Sentry error tracking and session replay for the frontend.
 * Session Replay records user interactions to help debug issues.
 * 
 * Privacy: Sensitive input fields are automatically masked.
 */

// Wait for Sentry to be loaded by the loader script
window.addEventListener('DOMContentLoaded', () => {
  if (window.Sentry) {
    // Session Replay is enabled via the Loader Script configuration
    // Additional configuration can be done here if needed
    
    console.log('✅ Sentry initialized with Session Replay');
    
    // Set user context (optional - helps identify sessions)
    // We don't collect personal data, just a session ID
    window.Sentry.setUser({
      id: generateSessionId()
    });
    
    // Add custom tags for better filtering
    window.Sentry.setTag('app_version', '1.4.0');
    window.Sentry.setTag('environment', window.location.hostname.includes('localhost') ? 'development' : 'production');
    
  } else {
    console.warn('⚠️ Sentry not loaded - Session Replay disabled');
  }
});

/**
 * Generate a random session ID for tracking
 * This is NOT personally identifiable
 */
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Manually capture an error to Sentry
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export function captureError(error, context = {}) {
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error('Sentry not available:', error);
  }
}

/**
 * Capture a custom message to Sentry
 * @param {string} message - The message to log
 * @param {string} level - Severity level (info, warning, error)
 */
export function captureMessage(message, level = 'info') {
  if (window.Sentry) {
    window.Sentry.captureMessage(message, level);
  }
}

/**
 * Test function to verify Sentry Session Replay is working
 * This triggers a test error and should create a session replay
 */
export function testSentryReplay() {
  console.log('🧪 Testing Sentry Session Replay...');
  
  if (!window.Sentry) {
    alert('❌ Sentry is not loaded. Check your configuration.');
    return;
  }
  
  // Capture a test message
  window.Sentry.captureMessage('Test: Session Replay Verification', 'info');
  
  // Trigger a test error after a short delay
  setTimeout(() => {
    try {
      throw new Error('This is a test error for Session Replay verification');
    } catch (error) {
      window.Sentry.captureException(error);
      console.log('✅ Test error sent to Sentry');
      alert('✅ Test-Fehler wurde an Sentry gesendet!\n\nÜberprüfen Sie in wenigen Sekunden:\n1. Sentry Dashboard → Issues\n2. Klicken Sie auf den Test-Fehler\n3. Gehen Sie zum "Replays" Tab\n4. Schauen Sie sich die Session-Aufzeichnung an');
    }
  }, 1000);
}
