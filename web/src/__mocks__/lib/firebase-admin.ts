/**
 * Mock for @/lib/firebase-admin
 * Uses the global mockFirestore from jest.setup.js
 */

export const db = (global as any).mockFirestore;

export const auth = {
  verifyIdToken: jest.fn(),
  setCustomUserClaims: jest.fn(),
};

export const storage = {
  bucket: jest.fn(() => ({
    file: jest.fn(),
    upload: jest.fn(),
  })),
};

export const setCustomClaims = jest.fn();
export const verifyIdToken = jest.fn();
