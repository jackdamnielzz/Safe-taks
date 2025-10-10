/**
 * Location verification types for GPS integration
 * Part of SafeWork Pro TRA/LMRA system
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // Accuracy in meters
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null; // Direction of travel in degrees
  speed?: number | null; // Speed in meters per second
}

export interface LocationTimestamps {
  capturedAt: Date; // When location was captured
  expiresAt?: Date; // When location data expires
  lastVerifiedAt?: Date; // When location was last verified
}

export interface LocationMetadata {
  source: "gps" | "network" | "manual"; // How location was obtained
  deviceId?: string; // Unique device identifier
  sessionId?: string; // LMRA session identifier
  traId?: string; // Associated TRA ID
  projectId?: string; // Associated project ID
  verificationMethod?: "auto" | "manual" | "qr_scan";
  privacyConsent: boolean; // User consent for location tracking
  isOffline: boolean; // Whether captured offline
}

export interface LocationVerification {
  id: string;
  coordinates: LocationCoordinates;
  timestamps: LocationTimestamps;
  metadata: LocationMetadata;
  address?: LocationAddress; // Reverse geocoded address
  verificationStatus: "pending" | "verified" | "failed" | "expired";
  verificationScore: number; // 0-100 confidence score
  notes?: string; // User notes about location
}

export interface LocationAddress {
  formatted?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface LocationAccuracyThresholds {
  excellent: number; // < 5 meters
  good: number; // < 10 meters
  fair: number; // < 20 meters
  poor: number; // >= 20 meters
}

export interface LocationPrivacySettings {
  enableLocationTracking: boolean;
  shareLocationWithTeam: boolean;
  retainLocationHistory: boolean;
  locationRetentionDays: number;
  autoVerifyLocation: boolean;
  requireExplicitConsent: boolean;
}

export interface LocationCacheEntry {
  id: string;
  location: LocationVerification;
  syncedAt?: Date; // When synced to server
  isPendingSync: boolean;
}

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  timestamp: Date;
  context?: string;
}

export type LocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "ACCURACY_TOO_LOW"
  | "LOCATION_EXPIRED"
  | "OFFLINE_MODE"
  | "USER_DECLINED"
  | "GPS_DISABLED"
  | "UNKNOWN_ERROR";

export interface LocationVerificationRequest {
  traId?: string;
  projectId?: string;
  sessionId?: string; // LMRA session identifier
  requiredAccuracy?: number; // Minimum accuracy in meters
  timeout?: number; // Timeout in milliseconds
  enableHighAccuracy?: boolean;
  maximumAge?: number; // Maximum age of cached position
  verificationMethod?: "auto" | "manual";
}

export interface LocationVerificationResponse {
  success: boolean;
  location?: LocationVerification;
  error?: LocationError;
  verificationTime: number; // Time taken in milliseconds
}

export interface LocationSettings {
  accuracyThresholds: LocationAccuracyThresholds;
  privacy: LocationPrivacySettings;
  offline: {
    enableOfflineCaching: boolean;
    maxCacheEntries: number;
    cacheExpiryHours: number;
  };
  verification: {
    autoVerify: boolean;
    requirePhoto: boolean;
    requireNotes: boolean;
    maxVerificationAttempts: number;
  };
}

// Helper functions for location validation
export function isValidCoordinates(coords: LocationCoordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    coords.accuracy > 0
  );
}

export function isLocationExpired(location: LocationVerification): boolean {
  if (!location.timestamps.expiresAt) return false;
  return new Date() > location.timestamps.expiresAt;
}

export function getLocationAccuracyLevel(
  accuracy: number,
  thresholds: LocationAccuracyThresholds
): "excellent" | "good" | "fair" | "poor" {
  if (accuracy < thresholds.excellent) return "excellent";
  if (accuracy < thresholds.good) return "good";
  if (accuracy < thresholds.fair) return "fair";
  return "poor";
}

export function calculateVerificationScore(
  accuracy: number,
  age: number, // Age in milliseconds
  thresholds: LocationAccuracyThresholds
): number {
  // Base score from accuracy (0-70 points)
  let accuracyScore = 0;
  if (accuracy < thresholds.excellent) accuracyScore = 70;
  else if (accuracy < thresholds.good) accuracyScore = 50;
  else if (accuracy < thresholds.fair) accuracyScore = 30;
  else accuracyScore = 10;

  // Age penalty (0-30 points)
  const ageMinutes = age / (1000 * 60);
  let ageScore = Math.max(0, 30 - ageMinutes);

  return Math.round(accuracyScore + ageScore);
}
