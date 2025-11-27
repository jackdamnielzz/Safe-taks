/**
 * Unit tests for Location Service
 * Tests GPS location capture, accuracy validation, privacy controls, and offline caching
 */

import { locationService } from "@/lib/locationService";
import type {
  LocationVerificationRequest,
  LocationSettings,
  LocationCoordinates,
} from "@/lib/types/location";

// Use the global navigator.geolocation mock configured in jest.setup.js
const mockGeolocation = global.navigator.geolocation as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(window.navigator, "onLine", {
  value: true,
  writable: true,
});

describe("LocationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Reset the locationService instance to clear cache and state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (locationService as any).cache.clear();
    (locationService as any).isWatching = false;
    (locationService as any).watchId = null;
  });

  describe("getCurrentLocation", () => {
    it("should successfully get current location with high accuracy", async () => {
      // Mock successful position
      const mockPosition = {
        coords: {
          latitude: 52.3676,
          longitude: 4.9041,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      const request: LocationVerificationRequest = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      };

      const response = await locationService.getCurrentLocation(request);

      expect(response.success).toBe(true);
      expect(response.location).toBeDefined();
      expect(response.location?.coordinates.latitude).toBe(52.3676);
      expect(response.location?.coordinates.longitude).toBe(4.9041);
      expect(response.location?.coordinates.accuracy).toBe(5);
      expect(response.location?.verificationStatus).toBe("verified");
      expect(response.location?.metadata.source).toBe("gps");
    });

    it("should handle permission denied error", async () => {
      // Mock permission denied error
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: "User denied the request for Geolocation.",
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => error(mockError));

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      const response = await locationService.getCurrentLocation();

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("PERMISSION_DENIED");
      expect(response.error?.message).toContain("denied");
    });

    it("should handle timeout error", async () => {
      // Mock timeout error
      const mockError = {
        code: 3, // TIMEOUT
        message: "The request to get user location timed out.",
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => error(mockError));

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      const request: LocationVerificationRequest = {
        timeout: 1000, // Short timeout for testing
      };

      const response = await locationService.getCurrentLocation(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("TIMEOUT");
    });

    it("should return error when privacy consent is not granted", async () => {
      // Mock no consent
      localStorageMock.getItem.mockReturnValue("denied");

      const response = await locationService.getCurrentLocation();

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("USER_DECLINED");
      expect(response.error?.message).toContain("disabled");
    });

    it("should validate coordinates and return error for invalid location", async () => {
      // Mock invalid position (latitude out of range)
      const mockPosition = {
        coords: {
          latitude: 91, // Invalid latitude
          longitude: 4.9041,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      const response = await locationService.getCurrentLocation();

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("POSITION_UNAVAILABLE");
      expect(response.error?.message).toContain("Invalid coordinates");
    });
  });

  describe("startWatchingLocation", () => {
    it("should start watching location with callback", async () => {
      // Mock successful position
      const mockPosition = {
        coords: {
          latitude: 52.3676,
          longitude: 4.9041,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.watchPosition.mockReturnValue(123); // Mock watchId

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      const callback = jest.fn();
      const success = await locationService.startWatchingLocation(callback);

      expect(success).toBe(true);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });

    it("should fail to start watching when privacy consent is not granted", async () => {
      // Mock no consent
      localStorageMock.getItem.mockReturnValue("denied");

      const callback = jest.fn();
      const success = await locationService.startWatchingLocation(callback);

      expect(success).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("stopWatchingLocation", () => {
    it("should stop watching location", async () => {
      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");
      
      // Mock watchId deterministically for this test
      mockGeolocation.watchPosition.mockReturnValue(123);

      const callback = jest.fn();
      await locationService.startWatchingLocation(callback);

      locationService.stopWatchingLocation();
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
    });
  });

  describe("location caching", () => {
    it("should cache location when offline caching is enabled", async () => {
      // Mock successful position
      const mockPosition = {
        coords: {
          latitude: 52.3676,
          longitude: 4.9041,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));

      // Mock privacy consent
      localStorageMock.getItem.mockReturnValue("granted");

      // Enable offline caching
      const settings: Partial<LocationSettings> = {
        offline: {
          enableOfflineCaching: true,
          maxCacheEntries: 50,
          cacheExpiryHours: 24,
        },
      };
      locationService.updateSettings(settings);

      const response = await locationService.getCurrentLocation();

      expect(response.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should retrieve cached locations", () => {
      // Seed the in-memory cache directly on the singleton instance.
      // This matches the implementation contract: getCachedLocations reads from the internal cache map.
      const now = new Date();
      const location = {
        id: "loc_123",
        coordinates: {
          latitude: 52.3676,
          longitude: 4.9041,
          accuracy: 5,
        },
        timestamps: {
          capturedAt: now,
          expiresAt: new Date(now.getTime() + 3600000),
          lastVerifiedAt: now,
        },
        metadata: {
          source: "gps",
          privacyConsent: true,
          isOffline: false,
        },
        verificationStatus: "verified",
        verificationScore: 85,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (locationService as any).cache.set("loc_123", {
        id: "loc_123",
        location,
        isPendingSync: false,
      });

      const cachedLocations = locationService.getCachedLocations();

      expect(cachedLocations).toHaveLength(1);
      expect(cachedLocations[0].coordinates.latitude).toBe(52.3676);
    });

    it("should clear location cache", () => {
      locationService.clearCache();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe("settings management", () => {
    it("should update location settings", () => {
      const newSettings: Partial<LocationSettings> = {
        accuracyThresholds: {
          excellent: 3,
          good: 8,
          fair: 15,
          poor: 15,
        },
        privacy: {
          enableLocationTracking: false,
          shareLocationWithTeam: false,
          retainLocationHistory: false,
          locationRetentionDays: 7,
          autoVerifyLocation: false,
          requireExplicitConsent: false,
        },
      };

      locationService.updateSettings(newSettings);
      const settings = locationService.getSettings();

      expect(settings.accuracyThresholds.excellent).toBe(3);
      expect(settings.privacy.enableLocationTracking).toBe(false);
    });

    it("should return current settings", () => {
      const settings = locationService.getSettings();
      expect(settings).toBeDefined();
      expect(settings.accuracyThresholds).toBeDefined();
      expect(settings.privacy).toBeDefined();
      expect(settings.offline).toBeDefined();
      expect(settings.verification).toBeDefined();
    });
  });
});
