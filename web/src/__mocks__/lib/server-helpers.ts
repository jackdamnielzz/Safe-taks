/**
 * Global mock for server-helpers used in tests.
 * Return initializeAdmin that always provides the in-memory global.mockFirestore from jest.setup.js
 */
export const requireOrgAuth = jest.fn(async (req?: any) => {
  return { uid: "test-user", orgId: "test-org", roles: ["admin"] };
});

export const getOrgIdFromRequest = jest.fn((req?: any) => "test-org");

export const initializeAdmin = jest.fn(() => {
  return { firestore: (global as any).mockFirestore };
});

export default {
  requireOrgAuth,
  getOrgIdFromRequest,
  initializeAdmin,
};
