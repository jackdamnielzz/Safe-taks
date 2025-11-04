/**
 * Minimal analytics shim for tests.
 * Exports functions used by application code. When running under Jest, jest.setup.js will
 * replace or spy on these via global.mockLogEvent. This file ensures imports like
 * 'src/lib/analytics' resolve during test setup.
 */

module.exports = {
  logEvent: (...args) => {
    if (typeof global !== 'undefined' && typeof global.mockLogEvent === 'function') {
      return global.mockLogEvent(...args);
    }
    // noop fallback
    return undefined;
  },
  trackUserLogin: (payload) => {
    if (typeof global !== 'undefined' && typeof global.mockLogEvent === 'function') {
      return global.mockLogEvent({}, 'login', payload);
    }
  },
  trackUserRegistration: (payload) => {
    if (typeof global !== 'undefined' && typeof global.mockLogEvent === 'function') {
      return global.mockLogEvent({}, 'sign_up', payload);
    }
  },
};
