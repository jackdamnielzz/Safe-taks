/**
 * React hook for location verification
 * Provides easy access to GPS location services with privacy controls
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  locationService,
  LocationVerification,
  LocationVerificationRequest,
  LocationVerificationResponse,
  LocationError,
  LocationSettings,
} from "@/lib/locationService";

interface UseLocationVerificationState {
  location: LocationVerification | null;
  isLoading: boolean;
  error: LocationError | null;
  isWatching: boolean;
  hasPermission: boolean | null; // null = not checked yet
  privacyConsent: boolean;
}

interface UseLocationVerificationActions {
  getCurrentLocation: (
    request?: LocationVerificationRequest
  ) => Promise<LocationVerificationResponse>;
  startWatching: (callback?: (location: LocationVerification) => void) => Promise<boolean>;
  stopWatching: () => void;
  requestPermission: () => Promise<boolean>;
  grantPrivacyConsent: () => void;
  revokePrivacyConsent: () => void;
  updateSettings: (settings: Partial<LocationSettings>) => void;
  clearCache: () => void;
  retry: () => Promise<LocationVerificationResponse>;
}

interface UseLocationVerificationReturn
  extends UseLocationVerificationState,
    UseLocationVerificationActions {}

export function useLocationVerification(
  defaultRequest?: LocationVerificationRequest
): UseLocationVerificationReturn {
  const [state, setState] = useState<UseLocationVerificationState>({
    location: null,
    isLoading: false,
    error: null,
    isWatching: false,
    hasPermission: null,
    privacyConsent: false,
  });

  const lastRequestRef = useRef<LocationVerificationRequest | undefined>(defaultRequest);
  const watchCallbackRef = useRef<((location: LocationVerification) => void) | undefined>(
    undefined
  );

  // Check initial permission and consent status
  useEffect(() => {
    const checkInitialStatus = async () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setState((prev) => ({
          ...prev,
          error: {
            code: "POSITION_UNAVAILABLE",
            message: "Geolocation is not supported by this browser",
            timestamp: new Date(),
          },
          hasPermission: false,
        }));
        return;
      }

      // Check permission status
      if ("permissions" in navigator) {
        try {
          const result = await navigator.permissions.query({ name: "geolocation" });
          setState((prev) => ({
            ...prev,
            hasPermission: result.state === "granted",
          }));

          // Listen for permission changes
          result.addEventListener("change", () => {
            setState((prev) => ({
              ...prev,
              hasPermission: result.state === "granted",
            }));
          });
        } catch (error) {
          // Some browsers don't support permissions API
          console.warn("Permissions API not supported:", error);
        }
      }

      // Check privacy consent
      const consent = localStorage.getItem("safework-pro-location-consent");
      setState((prev) => ({
        ...prev,
        privacyConsent: consent === "granted",
      }));
    };

    checkInitialStatus();
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(
    async (request?: LocationVerificationRequest): Promise<LocationVerificationResponse> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const mergedRequest = { ...lastRequestRef.current, ...request };
      lastRequestRef.current = mergedRequest;

      try {
        const response = await locationService.getCurrentLocation(mergedRequest);

        if (response.success && response.location) {
          setState((prev) => ({
            ...prev,
            location: response.location!,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: response.error || null,
          }));
        }

        return response;
      } catch (error) {
        const locationError: LocationError = {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          error: locationError,
        }));

        return {
          success: false,
          error: locationError,
          verificationTime: 0,
        };
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  // Start watching location
  const startWatching = useCallback(
    async (callback?: (location: LocationVerification) => void): Promise<boolean> => {
      if (callback) {
        watchCallbackRef.current = callback;
      }

      const success = await locationService.startWatchingLocation((location) => {
        setState((prev) => ({
          ...prev,
          location,
          error: null,
        }));

        if (watchCallbackRef.current) {
          watchCallbackRef.current(location);
        }
      });

      setState((prev) => ({
        ...prev,
        isWatching: success,
      }));

      return success;
    },
    []
  );

  // Stop watching location
  const stopWatching = useCallback(() => {
    locationService.stopWatchingLocation();
    setState((prev) => ({
      ...prev,
      isWatching: false,
    }));
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const response = await locationService.getCurrentLocation({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0,
      });

      const granted = response.success;
      setState((prev) => ({
        ...prev,
        hasPermission: granted,
      }));

      return granted;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        hasPermission: false,
      }));
      return false;
    }
  }, []);

  // Grant privacy consent
  const grantPrivacyConsent = useCallback(() => {
    localStorage.setItem("safework-pro-location-consent", "granted");
    setState((prev) => ({
      ...prev,
      privacyConsent: true,
    }));
  }, []);

  // Revoke privacy consent
  const revokePrivacyConsent = useCallback(() => {
    localStorage.setItem("safework-pro-location-consent", "denied");
    setState((prev) => ({
      ...prev,
      privacyConsent: false,
    }));
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<LocationSettings>) => {
    locationService.updateSettings(settings);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    locationService.clearCache();
  }, []);

  // Retry last request
  const retry = useCallback(async (): Promise<LocationVerificationResponse> => {
    return getCurrentLocation(lastRequestRef.current);
  }, [getCurrentLocation]);

  // Clean up watching on unmount
  useEffect(() => {
    return () => {
      if (state.isWatching) {
        stopWatching();
      }
    };
  }, [state.isWatching, stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
    grantPrivacyConsent,
    revokePrivacyConsent,
    updateSettings,
    clearCache,
    retry,
  };
}

// Convenience hook for one-time location verification
export function useVerifyLocation(
  request?: LocationVerificationRequest
): [
  () => Promise<LocationVerificationResponse>,
  LocationVerification | null,
  boolean,
  LocationError | null,
] {
  const { getCurrentLocation, location, isLoading, error } = useLocationVerification(request);

  const verifyLocation = useCallback(() => {
    return getCurrentLocation(request);
  }, [getCurrentLocation, request]);

  return [verifyLocation, location, isLoading, error];
}

// Hook for continuous location tracking
export function useLocationTracking(
  callback?: (location: LocationVerification) => void,
  options?: PositionOptions
): [boolean, () => Promise<boolean>, () => void, LocationVerification | null] {
  const { isWatching, startWatching, stopWatching, location } = useLocationVerification();

  const startTracking = useCallback(async () => {
    return startWatching(callback);
  }, [startWatching, callback]);

  return [isWatching, startTracking, stopWatching, location];
}
