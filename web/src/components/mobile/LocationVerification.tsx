/**
 * Mobile-optimized Location Verification Component
 * Provides UI for GPS location capture with accuracy validation and privacy controls
 */

import React, { useState, useEffect } from "react";
import type {
  LocationVerification,
  LocationVerificationRequest,
  LocationError,
  LocationErrorCode,
} from "@/lib/locationService";
import { useLocationVerification } from "@/hooks/useLocationVerification";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
// Simple touch feedback implementation since useTouchOptimized is not available yet
const useTouchOptimized = () => {
  const addTouchFeedback = () => {
    // Simple haptic feedback implementation
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // Light vibration for 10ms
    }
  };

  return { addTouchFeedback };
};

interface LocationVerificationProps {
  onLocationVerified?: (location: LocationVerification) => void;
  onLocationError?: (error: LocationError) => void;
  request?: LocationVerificationRequest;
  showPrivacyConsent?: boolean;
  showAccuracyIndicator?: boolean;
  className?: string;
}

export function LocationVerification({
  onLocationVerified,
  onLocationError,
  request,
  showPrivacyConsent = true,
  showAccuracyIndicator = true,
  className = "",
}: LocationVerificationProps) {
  const {
    location,
    isLoading,
    error,
    hasPermission,
    privacyConsent,
    getCurrentLocation,
    requestPermission,
    grantPrivacyConsent,
    revokePrivacyConsent,
    retry,
  } = useLocationVerification(request);

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const { addTouchFeedback } = useTouchOptimized();

  // Handle location verification success
  useEffect(() => {
    if (location && location.verificationStatus === "verified") {
      onLocationVerified?.(location);
    }
  }, [location, onLocationVerified]);

  // Handle location errors
  useEffect(() => {
    if (error) {
      onLocationError?.(error);
    }
  }, [error, onLocationError]);

  // Check for consent on mount if needed
  useEffect(() => {
    if (showPrivacyConsent && !privacyConsent && hasPermission !== false) {
      setShowConsentModal(true);
    }
  }, [showPrivacyConsent, privacyConsent, hasPermission]);

  const handleVerifyLocation = async () => {
    addTouchFeedback();

    // Check permission first
    if (hasPermission === false) {
      setShowPermissionModal(true);
      return;
    }

    // Check privacy consent
    if (showPrivacyConsent && !privacyConsent) {
      setShowConsentModal(true);
      return;
    }

    // Get current location
    const response = await getCurrentLocation(request);

    if (!response.success && response.error) {
      // Handle specific error types
      if (response.error.code === "PERMISSION_DENIED") {
        setShowPermissionModal(true);
      } else if (response.error.code === "USER_DECLINED") {
        setShowConsentModal(true);
      }
    }
  };

  const handleGrantConsent = () => {
    addTouchFeedback();
    grantPrivacyConsent();
    setShowConsentModal(false);
    // Auto-verify location after consent
    setTimeout(() => {
      handleVerifyLocation();
    }, 500);
  };

  const handleRequestPermission = async () => {
    addTouchFeedback();
    const granted = await requestPermission();
    setShowPermissionModal(false);

    if (granted) {
      // Auto-verify location after permission granted
      setTimeout(() => {
        handleVerifyLocation();
      }, 500);
    }
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy < 5) return "text-green-600";
    if (accuracy < 10) return "text-blue-600";
    if (accuracy < 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyText = (accuracy: number): string => {
    if (accuracy < 5) return "Uitstekend";
    if (accuracy < 10) return "Goed";
    if (accuracy < 20) return "Redelijk";
    return "Slecht";
  };

  const getErrorMessage = (error: LocationError): string => {
    switch (error.code) {
      case "PERMISSION_DENIED":
        return "Locatietoegang geweigerd. Sta locatietoegang toe in uw browserinstellingen.";
      case "POSITION_UNAVAILABLE":
        return "Locatie informatie niet beschikbaar. Controleer of GPS is ingeschakeld.";
      case "TIMEOUT":
        return "Time-out bij het ophalen van locatie. Probeer het opnieuw.";
      case "USER_DECLINED":
        return "U heeft geen toestemming gegeven voor locatietracking.";
      case "GPS_DISABLED":
        return "GPS is uitgeschakeld. Schakel GPS in en probeer het opnieuw.";
      case "NETWORK_ERROR":
        return "Netwerkfout bij het ophalen van locatie. Controleer uw verbinding.";
      case "ACCURACY_TOO_LOW":
        return "Locatienauwkeurigheid is te laag. Ga naar een open plek en probeer opnieuw.";
      case "OFFLINE_MODE":
        return "Offline modus. Locatie wordt opgeslagen en gesynchroniseerd wanneer u weer online bent.";
      default:
        return error.message || "Onbekende fout opgetreden.";
    }
  };

  return (
    <div className={`location-verification ${className}`}>
      {/* Main verification UI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Locatie Verificatie</h3>
          {showAccuracyIndicator && location && (
            <div
              className={`text-sm font-medium ${getAccuracyColor(location.coordinates.accuracy)}`}
            >
              {getAccuracyText(location.coordinates.accuracy)} (
              {Math.round(location.coordinates.accuracy)}m)
            </div>
          )}
        </div>

        {/* Location status */}
        {location ? (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Locatie geverifieerd</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Latitude: {location.coordinates.latitude.toFixed(6)}</div>
              <div>Longitude: {location.coordinates.longitude.toFixed(6)}</div>
              <div>Nauwkeurigheid: ±{Math.round(location.coordinates.accuracy)}m</div>
              {location.coordinates.altitude && (
                <div>Hoogte: {Math.round(location.coordinates.altitude)}m</div>
              )}
            </div>
            {showAccuracyIndicator && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Betrouwbaarheidsscore:</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${location.verificationScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{location.verificationScore}/100</div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Geen locatie</span>
            </div>
            <div className="text-sm text-gray-600">
              Druk op de knop hieronder om uw huidige locatie te verifiëren.
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="error" className="mb-4">
            <p className="text-sm">{getErrorMessage(error)}</p>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleVerifyLocation}
            disabled={isLoading}
            className="w-full touch-target-lg"
            variant={location ? "secondary" : "primary"}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Locatie ophalen...
              </>
            ) : location ? (
              "Locatie vernieuwen"
            ) : (
              "Locatie verifiëren"
            )}
          </Button>

          {error && (
            <Button onClick={retry} variant="outline" className="w-full touch-target-lg">
              Opnieuw proberen
            </Button>
          )}

          {/* Privacy controls */}
          {showPrivacyConsent && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Locatie tracking</span>
                <button
                  onClick={() =>
                    privacyConsent ? revokePrivacyConsent() : setShowConsentModal(true)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacyConsent ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacyConsent ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {privacyConsent
                  ? "Locatie tracking is ingeschakeld"
                  : "Locatie tracking is uitgeschakeld"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy consent modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Locatie Toestemming</h3>
            <p className="text-sm text-gray-600 mb-6">
              SafeWork Pro heeft uw toestemming nodig om uw locatie te gebruiken voor
              veiligheidsverificatie. Uw locatiegegevens worden alleen gebruikt voor TRA/LMRA
              verificatie en worden gedeeld volgens uw privacyinstellingen.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleGrantConsent} variant="primary" className="flex-1">
                Toestaan
              </Button>
              <Button
                onClick={() => setShowConsentModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permission request modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Locatietoegang</h3>
            <p className="text-sm text-gray-600 mb-6">
              SafeWork Pro heeft toegang tot uw locatie nodig. Sta locatietoegang toe in uw browser
              wanneer u wordt gevraagd, of open uw browserinstellingen om dit handmatig in te
              schakelen.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleRequestPermission} variant="primary" className="flex-1">
                Toegang verzoeken
              </Button>
              <Button
                onClick={() => setShowPermissionModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
