/**
 * GPS Location Service for SafeWork Pro
 * Handles location capture, accuracy validation, privacy controls, and offline caching
 */

import {
  LocationCoordinates,
  LocationVerification,
  LocationVerificationRequest,
  LocationVerificationResponse,
  LocationError,
  LocationErrorCode,
  LocationSettings,
  LocationCacheEntry,
  isValidCoordinates,
  isLocationExpired,
  getLocationAccuracyLevel,
  calculateVerificationScore,
} from "@/lib/types/location";

// Default settings for location verification
const DEFAULT_SETTINGS: LocationSettings = {
  accuracyThresholds: {
    excellent: 5, // < 5 meters
    good: 10, // < 10 meters
    fair: 20, // < 20 meters
    poor: 20, // >= 20 meters
  },
  privacy: {
    enableLocationTracking: true,
    shareLocationWithTeam: false,
    retainLocationHistory: true,
    locationRetentionDays: 30,
    autoVerifyLocation: true,
    requireExplicitConsent: true,
  },
  offline: {
    enableOfflineCaching: true,
    maxCacheEntries: 50,
    cacheExpiryHours: 24,
  },
  verification: {
    autoVerify: true,
    requirePhoto: false,
    requireNotes: false,
    maxVerificationAttempts: 3,
  },
};

class LocationService {
  private settings: LocationSettings;
  private watchId: number | null = null;
  private isWatching: boolean = false;
  private cache: Map<string, LocationCacheEntry> = new Map();
  private readonly CACHE_KEY = "safework-pro-location-cache";

  constructor(settings?: Partial<LocationSettings>) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.loadCacheFromStorage();
  }

  /**
   * Request current location with verification
   */
  async getCurrentLocation(
    request?: LocationVerificationRequest
  ): Promise<LocationVerificationResponse> {
    const startTime = Date.now();

    try {
      // Check privacy settings and consent
      if (!this.checkPrivacyConsent()) {
        return {
          success: false,
          error: {
            code: "USER_DECLINED",
            message: "Location tracking is disabled or user has not provided consent",
            timestamp: new Date(),
          },
          verificationTime: Date.now() - startTime,
        };
      }

      // Check if we have a valid cached location
      if (request?.maximumAge && request.maximumAge > 0) {
        const cachedLocation = this.getCachedLocation(request.maximumAge);
        if (
          cachedLocation &&
          this.meetsAccuracyRequirements(cachedLocation, request?.requiredAccuracy)
        ) {
          return {
            success: true,
            location: cachedLocation,
            verificationTime: Date.now() - startTime,
          };
        }
      }

      // Request new location from browser
      const position = await this.requestPositionFromBrowser({
        enableHighAccuracy: request?.enableHighAccuracy ?? true,
        timeout: request?.timeout ?? 30000,
        maximumAge: request?.maximumAge ?? 0,
      });

      // Convert browser position to our format
      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      };

      // Validate coordinates
      if (!isValidCoordinates(coordinates)) {
        return {
          success: false,
          error: {
            code: "POSITION_UNAVAILABLE",
            message: "Invalid coordinates received from GPS",
            timestamp: new Date(),
          },
          verificationTime: Date.now() - startTime,
        };
      }

      // Create location verification object
      const location: LocationVerification = {
        id: this.generateLocationId(),
        coordinates,
        timestamps: {
          capturedAt: new Date(position.timestamp),
          expiresAt: this.calculateExpiryTime(),
          lastVerifiedAt: new Date(),
        },
        metadata: {
          source: "gps",
          deviceId: await this.getDeviceId(),
          sessionId: request?.sessionId,
          traId: request?.traId,
          projectId: request?.projectId,
          verificationMethod: request?.verificationMethod || "auto",
          privacyConsent: true,
          isOffline: !navigator.onLine,
        },
        verificationStatus: "verified",
        verificationScore: calculateVerificationScore(
          coordinates.accuracy,
          0, // Fresh location has no age
          this.settings.accuracyThresholds
        ),
      };

      // Cache the location if offline caching is enabled
      if (this.settings.offline.enableOfflineCaching) {
        this.cacheLocation(location);
      }

      return {
        success: true,
        location,
        verificationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleLocationError(error),
        verificationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Start watching location changes
   */
  async startWatchingLocation(
    callback: (location: LocationVerification) => void,
    options?: PositionOptions
  ): Promise<boolean> {
    if (this.isWatching) {
      console.warn("Location watching already started");
      return true;
    }

    try {
      if (!this.checkPrivacyConsent()) {
        throw new Error("Location tracking requires user consent");
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = this.createLocationFromPosition(position);
          callback(location);

          // Cache the location
          if (this.settings.offline.enableOfflineCaching) {
            this.cacheLocation(location);
          }
        },
        (error) => {
          console.error("Location watch error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000,
          ...options,
        }
      );

      this.isWatching = true;
      return true;
    } catch (error) {
      console.error("Failed to start location watching:", error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  /**
   * Get cached locations
   */
  getCachedLocations(): LocationVerification[] {
    return Array.from(this.cache.values())
      .filter((entry) => !isLocationExpired(entry.location))
      .map((entry) => entry.location);
  }

  /**
   * Clear location cache
   */
  clearCache(): void {
    this.cache.clear();
    this.saveCacheToStorage();
  }

  /**
   * Update location settings
   */
  updateSettings(newSettings: Partial<LocationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): LocationSettings {
    return { ...this.settings };
  }

  // Private methods

  private async requestPositionFromBrowser(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, (error) => reject(error), options);
    });
  }

  private createLocationFromPosition(position: GeolocationPosition): LocationVerification {
    const coordinates: LocationCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
    };

    return {
      id: this.generateLocationId(),
      coordinates,
      timestamps: {
        capturedAt: new Date(position.timestamp),
        expiresAt: this.calculateExpiryTime(),
        lastVerifiedAt: new Date(),
      },
      metadata: {
        source: "gps",
        deviceId: "unknown", // Will be populated in a real implementation
        privacyConsent: true,
        isOffline: !navigator.onLine,
      },
      verificationStatus: "verified",
      verificationScore: calculateVerificationScore(
        coordinates.accuracy,
        0,
        this.settings.accuracyThresholds
      ),
    };
  }

  private handleLocationError(error: any): LocationError {
    let code: LocationErrorCode;
    let message: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        code = "PERMISSION_DENIED";
        message = "User denied the request for Geolocation.";
        break;
      case error.POSITION_UNAVAILABLE:
        code = "POSITION_UNAVAILABLE";
        message = "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        code = "TIMEOUT";
        message = "The request to get user location timed out.";
        break;
      default:
        code = "UNKNOWN_ERROR";
        message = "An unknown error occurred.";
        break;
    }

    return {
      code,
      message,
      timestamp: new Date(),
      context: error.message,
    };
  }

  private checkPrivacyConsent(): boolean {
    if (!this.settings.privacy.enableLocationTracking) {
      return false;
    }

    if (this.settings.privacy.requireExplicitConsent) {
      // Check if user has provided consent (stored in localStorage)
      // Only access localStorage in browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const consent = localStorage.getItem("safework-pro-location-consent");
        return consent === "granted";
      }
      // On server, assume consent required but not available
      return false;
    }

    return true;
  }

  private meetsAccuracyRequirements(
    location: LocationVerification,
    requiredAccuracy?: number
  ): boolean {
    if (!requiredAccuracy) return true;
    return location.coordinates.accuracy <= requiredAccuracy;
  }

  private getCachedLocation(maxAge: number): LocationVerification | null {
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const locationAge = now - entry.location.timestamps.capturedAt.getTime();

      if (locationAge <= maxAge && !isLocationExpired(entry.location)) {
        return entry.location;
      }
    }

    return null;
  }

  private cacheLocation(location: LocationVerification): void {
    // Check cache size limit
    if (this.cache.size >= this.settings.offline.maxCacheEntries) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: LocationCacheEntry = {
      id: location.id,
      location,
      isPendingSync: !navigator.onLine,
    };

    this.cache.set(location.id, entry);
    this.saveCacheToStorage();
  }

  private calculateExpiryTime(): Date {
    const now = new Date();
    // Location expires after 1 hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  private generateLocationId(): string {
    return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceId(): Promise<string> {
    // In a real implementation, this would get a unique device identifier
    // For now, we'll use a simple fingerprint
    // Only access localStorage in browser environment
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      let deviceId = localStorage.getItem("safework-pro-device-id");

      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("safework-pro-device-id", deviceId);
      }

      return deviceId;
    }

    // On server, return a placeholder
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadCacheFromStorage(): void {
    // Only access localStorage in browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const entries = JSON.parse(cachedData) as LocationCacheEntry[];

        // Convert date strings back to Date objects
        entries.forEach((entry) => {
          entry.location.timestamps.capturedAt = new Date(entry.location.timestamps.capturedAt);
          if (entry.location.timestamps.expiresAt) {
            entry.location.timestamps.expiresAt = new Date(entry.location.timestamps.expiresAt);
          }
          if (entry.location.timestamps.lastVerifiedAt) {
            entry.location.timestamps.lastVerifiedAt = new Date(
              entry.location.timestamps.lastVerifiedAt
            );
          }
          if (entry.syncedAt) {
            entry.syncedAt = new Date(entry.syncedAt);
          }

          this.cache.set(entry.id, entry);
        });
      }
    } catch (error) {
      console.error("Failed to load location cache from storage:", error);
    }
  }

  private saveCacheToStorage(): void {
    // Only access localStorage in browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Failed to save location cache to storage:", error);
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export types and utilities
export { LocationService, DEFAULT_SETTINGS };

// Re-export types for convenience
export type {
  LocationCoordinates,
  LocationVerification,
  LocationVerificationRequest,
  LocationVerificationResponse,
  LocationError,
  LocationErrorCode,
  LocationPrivacySettings,
  LocationCacheEntry,
  LocationSettings,
} from "@/lib/types/location";
