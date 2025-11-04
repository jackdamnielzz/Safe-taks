import React, { useCallback, useEffect, useState } from "react";
import { LMRAStep2_LocationVerification, LMRA } from "@/lib/types/lmra";
import PhotoGallery from "@/components/lmra/PhotoGallery";
import PhotoCapture from "@/components/lmra/PhotoCapture";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep2_LocationVerification>) => void;
  userId?: string;
  userName?: string;
};

export default function Step2_LocationVerification({ lmra, onChange, userId, userName }: Props) {
  const current = lmra?.step2;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [coords, setCoords] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>({
    latitude: current?.latitude,
    longitude: current?.longitude,
    accuracy: current?.accuracyMeters,
  });

  // Try to get location on mount if not already present
  useEffect(() => {
    if (!coords.latitude || !coords.longitude) {
      // Do not auto-request if user already has coordinates in LMRA
      if ("geolocation" in navigator) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            setLoading(false);
            setError(null);
          },
          (err) => {
            setError(err.message || "Locatie niet beschikbaar");
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setError("Geolocatie niet ondersteund door deze browser");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = useCallback(() => {
    if (!coords.latitude || !coords.longitude) {
      setError("Geen geldige GPS-coördinaten beschikbaar");
      return;
    }

    const payload: Partial<LMRAStep2_LocationVerification> = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: coords.accuracy,
      deviceTimestamp: new Date(),
      verifiedAt: new Date(),
      // verifiedBy should be set by the caller (server) or higher-level component with user context
    };

    onChange(payload);
  }, [coords, onChange]);

  const handleRefresh = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocatie niet ondersteund");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Kon locatie niet vernieuwen");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Verifieer de GPS-locatie ter plaatse. Gebruik de knop om actuele coördinaten te lezen en bevestig met
        "Verifieer".
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 border rounded">
          <div className="text-xs text-muted">Latitude</div>
          <div className="font-mono">{coords.latitude ?? "—"}</div>
        </div>
        <div className="p-3 border rounded">
          <div className="text-xs text-muted">Longitude</div>
          <div className="font-mono">{coords.longitude ?? "—"}</div>
        </div>
        <div className="p-3 border rounded">
          <div className="text-xs text-muted">Nauwkeurigheid (m)</div>
          <div className="font-mono">{coords.accuracy ?? "—"}</div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
          disabled={loading}
          aria-label="Ververs locatie"
        >
          {loading ? "Lezen…" : "Ververs locatie"}
        </button>

        <button onClick={handleVerify} className="btn btn-primary" aria-label="Verifieer locatie">
          Verifieer
        </button>
      </div>

      <div className="text-sm text-gray-600">
        {current?.locationName && <div>Geregistreerde locatie: {current.locationName}</div>}
        {current?.gpsNotes && <div>Opmerking: {current.gpsNotes}</div>}
      </div>

      {/* Photo Documentation */}
      {lmra?.id && userId && (
        <div className="mt-6 pt-6 border-t">
          <PhotoGallery
            lmraId={lmra.id}
            stepNumber={2}
            onAddPhoto={() => setShowCamera(true)}
            maxPhotos={5}
          />
        </div>
      )}

      {/* Photo Capture Modal */}
      {showCamera && lmra?.id && userId && (
        <PhotoCapture
          lmraId={lmra.id}
          stepNumber={2}
          userId={userId}
          userName={userName}
          onPhotoAdded={() => {
            // Photo added successfully, gallery will auto-refresh
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          maxPhotos={5}
        />
      )}
    </div>
  );
}
