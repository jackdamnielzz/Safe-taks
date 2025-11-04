/**
 * Firebase Admin mock that uses the global mockFirestore from jest.setup.js
 * This ensures all tests share the same in-memory database state.
 */

const admin = {
  apps: [],
  initializeApp: jest.fn(() => {
    admin.apps = [{}];
    return admin.apps[0];
  }),
  firestore: jest.fn(() => {
    // Return the global mockFirestore instance from jest.setup.js
    return global.mockFirestore;
  }),
  firestoreFieldValue: {
    increment: (n) => ({ _increment: n }),
  },
  auth: jest.fn(() => ({})),
  credential: {
    cert: jest.fn(),
  },
};

// Export both as default and named export for compatibility
module.exports = admin;
module.exports.default = admin;

// Also export db helper that matches the pattern used in lib/firebase-admin
const db = global.mockFirestore;
module.exports.db = db;
