/**
 * CommonJS mock for server-helpers to satisfy require(...) and default/commonjs imports in tests.
 * Exports initializeAdmin as a top-level function and as part of module.exports.
 */

function initializeAdmin() {
  // No-op in tests
  return;
}

module.exports = {
  requireOrgAuth: async (req, res, next) => next(),
  getOrgIdFromRequest: () => 'test-org',
  initializeAdmin,
};
