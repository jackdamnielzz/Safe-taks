/**
 * Artillery Processor for Authentication Tests
 * Provides helper functions for authentication scenarios
 */

module.exports = {
  /**
   * Generate random user data for registration
   */
  generateUserData: function(context, events, done) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    context.vars.randomEmail = `loadtest-${timestamp}-${random}@test.com`;
    context.vars.randomPassword = `LoadTest${timestamp}!`;
    context.vars.randomName = `Load Test User ${random}`;
    
    return done();
  },

  /**
   * Store authentication token from response
   */
  storeAuthToken: function(requestParams, response, context, ee, next) {
    if (response.body && response.body.token) {
      context.vars.authToken = response.body.token;
    }
    return next();
  },

  /**
   * Log authentication metrics
   */
  logAuthMetrics: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200) {
      ee.emit('counter', 'auth.success', 1);
    } else {
      ee.emit('counter', 'auth.failure', 1);
    }
    return next();
  },

  /**
   * Generate random think time (1-5 seconds)
   */
  randomThinkTime: function(context, events, done) {
    context.vars.thinkTime = Math.floor(Math.random() * 4) + 1;
    return done();
  }
};