/**
 * Mock for firebase/app used in tests.
 * Provides getApp and initializeApp minimal implementations.
 */

export function getApp() {
  return { name: "mock-app" };
}

export function initializeApp(config: any) {
  // no-op for tests
  return { name: "initialized-mock-app", options: config || {} };
}

export default {
  getApp,
  initializeApp,
};
