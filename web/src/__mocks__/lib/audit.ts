/**
 * Mock for @/lib/audit
 * Provides a jest.fn() for writeAuditLog that doesn't actually write to Firestore
 */

export const writeAuditLog = jest.fn(async () => {
  // Mock implementation - just return success
  return Promise.resolve();
});
