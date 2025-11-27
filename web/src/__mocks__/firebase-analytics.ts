/**
 * Mock for firebase/analytics
 * Provides mock implementations for analytics functions
 *
 * Adjusted: export a getAnalytics that accepts an optional app parameter and returns
 * a stable analytics object so analytics-service.getAnalytics(app) succeeds in tests.
 */

import { jest } from "@jest/globals";

export const mockLogEvent = jest.fn();
export const mockSetUserId = jest.fn();
export const mockSetUserProperties = jest.fn();

// stable analytics object returned by getAnalytics
const STUB_ANALYTICS = { app: {}, name: "mock-analytics" };

export const mockGetAnalytics = jest.fn((app?: any) => {
  // Return a stable object; optionally record the provided app for assertions
  return STUB_ANALYTICS;
});

// getAnalytics should accept either (app) or no args and return the stub analytics
export const getAnalytics = (app?: any) => {
  return mockGetAnalytics(app);
};

// Export functions that match firebase signature (analytics, ...args)
export const logEvent = (analytics: any, eventName: string, params?: any) => {
  mockLogEvent(analytics, eventName, params);
};
export const setUserId = (analytics: any, id: string) => {
  mockSetUserId(analytics, id);
};
export const setUserProperties = (analytics: any, props: any) => {
  mockSetUserProperties(analytics, props);
};

// Expose a global stub object so analytics-service can pick it up in tests
// (analytics-service looks for global.__MOCKED_FIREBASE_ANALYTICS__)
(global as any).__MOCKED_FIREBASE_ANALYTICS__ = {
  ...STUB_ANALYTICS,
  logEvent: mockLogEvent,
  setUserId: mockSetUserId,
  setUserProperties: mockSetUserProperties,
};

export type Analytics = typeof STUB_ANALYTICS;
