"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Navigation, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { LMRAStep2_LocationVerification, LMRA } from "@/lib/types/lmra";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep2_LocationVerification>) => void;
};

export default function Step2_LocationVerification({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step2");
  const current = lmra?.step2;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState(current?.locationName || "");
  const [notes, setNotes] = useState(current?.gpsNotes || "");

  // Auto-load location on mount if not already set
  useEffect(() => {
    if (!current?.latitude && !current?.longitude) {
      handleGetLocation();
    }
  }, []);

  const handleGetLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use centralized location service to respect consent + caching contract (AGENTS.md rule)
      const { getCurrentLocation } = await import("@/lib/locationService");
      const result = await getCurrentLocation();

      if (result.status !== "success" || !result.coords) {
        // Map standardized error codes to localized messages
        switch (result.errorCode) {
          case "permission_denied":
            setError(t("errors.permissionDenied"));
            break;
          case "position_unavailable":
            setError(t("errors.positionUnavailable"));
            break;
          case "timeout":
            setError(t("errors.timeout"));
            break;
          case "not_supported":
            setError(t("errors.notSupported"));
            break;
          case "user_rejected":
            setError(t("errors.permissionDenied"));
            break;
          default:
            setError(t("errors.general"));
        }
        setIsLoading(false);
        return;
      }

      const { latitude, longitude, accuracy } = result.coords;

      const payload: Partial<LMRAStep2_LocationVerification> = {
        latitude,
        longitude,
        accuracyMeters: typeof accuracy === "number" ? accuracy : undefined,
        deviceTimestamp: new Date(),
        verifiedAt: new Date(),
        locationName: locationName || undefined,
        gpsNotes: notes || undefined,
      };

      onChange(payload);
      setError(null);
    } catch (err) {
      console.error("Location service error:", err);
      setError(t("errors.general"));
    } finally {
      setIsLoading(false);
    }
  }, [locationName, notes, onChange]);

  const handleLocationNameChange = (value: string) => {
    setLocationName(value);
    if (current?.latitude && current?.longitude) {
      onChange({
        ...current,
        locationName: value || undefined,
      });
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (current?.latitude && current?.longitude) {
      onChange({
        ...current,
        gpsNotes: value || undefined,
      });
    }
  };

  const hasLocation = current?.latitude && current?.longitude;
  const accuracy = current?.accuracyMeters;
  const isAccurate = accuracy ? accuracy < 50 : false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Location Status */}
      {hasLocation ? (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-2">{t("locationVerified")}</h4>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {current.latitude?.toFixed(6)}, {current.longitude?.toFixed(6)}
                  </span>
                </div>
                {accuracy && (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span>
                      {t("accuracy")}: ±{Math.round(accuracy)}m
                      {isAccurate && (
                        <span className="ml-2 text-xs font-medium text-green-700">
                          ({t("excellent")})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {current.verifiedAt && (
                  <div className="text-xs text-green-700">
                    {t("verifiedAt")}:{" "}
                    {current.verifiedAt instanceof Date
                      ? current.verifiedAt.toLocaleString("nl-NL")
                      : new Date(current.verifiedAt.toMillis()).toLocaleString("nl-NL")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{t("locationNotVerified")}</h4>
              <p className="text-sm text-gray-600">{t("clickToVerify")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">{t("errorTitle")}</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Get Location Button */}
      <button
        onClick={handleGetLocation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("gettingLocation")}</span>
          </>
        ) : (
          <>
            <Navigation className="h-5 w-5" />
            <span>{hasLocation ? t("reverifyButton") : t("verifyButton")}</span>
          </>
        )}
      </button>

      {/* Location Name Input */}
      <div>
        <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-2">
          {t("locationName")}
        </label>
        <input
          type="text"
          id="locationName"
          value={locationName}
          onChange={(e) => handleLocationNameChange(e.target.value)}
          placeholder={t("locationNamePlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
        <p className="mt-1 text-xs text-gray-500">{t("locationNameHelp")}</p>
      </div>

      {/* Notes Input */}
      <div>
        <label htmlFor="gpsNotes" className="block text-sm font-medium text-gray-700 mb-2">
          {t("notes")}
        </label>
        <textarea
          id="gpsNotes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          placeholder={t("notesPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>

      {/* Accuracy Warning */}
      {hasLocation && accuracy && accuracy > 50 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-1">{t("lowAccuracyTitle")}</h4>
              <p className="text-sm text-yellow-700">
                {t("lowAccuracyMessage", { accuracy: Math.round(accuracy) })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">{t("tipsTitle")}</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• {t("tip1")}</li>
          <li>• {t("tip2")}</li>
          <li>• {t("tip3")}</li>
          <li>• {t("tip4")}</li>
        </ul>
      </div>
    </div>
  );
}

function getGeolocationErrorMessage(code: number, t: any): string {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return t("errors.permissionDenied");
    case 2: // POSITION_UNAVAILABLE
      return t("errors.positionUnavailable");
    case 3: // TIMEOUT
      return t("errors.timeout");
    default:
      return t("errors.unknown");
  }
}
