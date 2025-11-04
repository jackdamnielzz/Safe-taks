import React, { useCallback, useEffect, useState } from "react";
import { LMRAStep3_WeatherConditions, LMRA } from "@/lib/types/lmra";
import { getWeatherService } from "@/lib/weatherService";
import { Timestamp } from "firebase/firestore";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep3_WeatherConditions>) => void;
};

/**
 * Step3_WeatherConditions
 *
 * - Fetches real weather data from OpenWeather API based on LMRA location
 * - Auto-fetches when component loads if coordinates are available
 * - Provides caching (1-hour TTL) and retry logic
 * - Displays safety warnings for unsafe conditions
 * - Provides manual override toggle and notes field
 * - Graceful degradation if API fails
 */
export default function Step3_WeatherConditions({ lmra, onChange }: Props) {
  const current = lmra?.step3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
  const [blockingReasons, setBlockingReasons] = useState<string[]>([]);
  const [isBlocking, setIsBlocking] = useState(false);
  const [payload, setPayload] = useState<Partial<LMRAStep3_WeatherConditions>>(
    current || {
      manualOverride: false,
    }
  );

  // Auto-fetch weather when component loads (if coordinates available)
  useEffect(() => {
    // Initialize local state from lmra.step3
    setPayload((p) => ({ ...p, ...current }));

    // Auto-fetch weather if we have coordinates and no weather data yet
    const lat = (lmra?.step2 as any)?.latitude;
    const lon = (lmra?.step2 as any)?.longitude;
    
    if (lat && lon && !current?.temperatureC) {
      fetchWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWeather = useCallback(async () => {
    setError(null);
    setSafetyWarnings([]);
    setBlockingReasons([]);
    setIsBlocking(false);

    // Determine coords to use (from LMRA.step2 if present)
    const lat = (lmra?.step2 as any)?.latitude;
    const lon = (lmra?.step2 as any)?.longitude;
    
    if (!lat || !lon) {
      setError("Geen coördinaten beschikbaar — voer eerst locatie verificatie uit (Stap 2).");
      return;
    }

    setLoading(true);
    try {
      const weatherService = getWeatherService();
      const weather = await weatherService.getWeatherWithCache(lat, lon);

      // Determine work type from TRA if available
      const traType = (lmra?.step1 as any)?.traType;
      let workType: "general" | "height" | "electrical" | "confined_space" | "hot_work" = "general";
      
      if (traType?.includes("hoogte") || traType?.includes("height")) {
        workType = "height";
      } else if (traType?.includes("elektr") || traType?.includes("electric")) {
        workType = "electrical";
      } else if (traType?.includes("beperkte ruimte") || traType?.includes("confined")) {
        workType = "confined_space";
      } else if (traType?.includes("heet werk") || traType?.includes("hot work") || traType?.includes("las")) {
        workType = "hot_work";
      }

      // Check safety with enhanced rules
      const { safe, warnings, blocking, blockingReasons: reasons } = weatherService.isSafeForWork(weather, undefined, workType);
      
      if (blocking) {
        setIsBlocking(true);
        setBlockingReasons(reasons);
      }
      
      if (!safe && warnings.length > 0) {
        setSafetyWarnings(warnings);
      }

      // Convert Timestamp to Date for display
      const weatherPayload: Partial<LMRAStep3_WeatherConditions> = {
        provider: weather.provider,
        observationTimestamp: weather.observationTimestamp,
        temperatureC: weather.temperatureC,
        humidityPct: weather.humidityPct,
        windSpeedMs: weather.windSpeedMs,
        windDirectionDeg: weather.windDirectionDeg,
        precipitationMm: weather.precipitationMm,
        weatherDescription: weather.weatherDescription,
        severity: weather.severity,
        manualOverride: false,
      };

      setPayload((p) => ({ ...p, ...weatherPayload }));
      onChange(weatherPayload);
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      const errorMessage = err?.message || "Kon weergegevens niet ophalen";
      
      // Provide helpful error messages
      if (errorMessage.includes("API key not configured")) {
        setError("OpenWeather API key niet geconfigureerd. Neem contact op met de beheerder.");
      } else if (errorMessage.includes("401")) {
        setError("OpenWeather API key ongeldig. Neem contact op met de beheerder.");
      } else if (errorMessage.includes("429")) {
        setError("Te veel API verzoeken. Probeer het later opnieuw of voer handmatig in.");
      } else {
        setError(`${errorMessage}. Probeer het opnieuw of voer handmatig in.`);
      }
    } finally {
      setLoading(false);
    }
  }, [lmra?.step2, onChange]);

  const handleManualChange = useCallback(
    (changes: Partial<LMRAStep3_WeatherConditions>) => {
      const next = { ...payload, ...changes, manualOverride: true };
      setPayload(next);
      onChange(next);
    },
    [payload, onChange]
  );

  const toggleManualOverride = useCallback(() => {
    const newOverride = !(payload?.manualOverride ?? false);
    const next = { ...payload, manualOverride: newOverride };
    setPayload(next);
    onChange(next);
  }, [payload, onChange]);

  // Format observation timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "—";
    
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "object" && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        return "—";
      }
      
      return date.toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Error formatting timestamp:", err);
      return "—";
    }
  };

  // Format wind speed for display (convert m/s to km/h)
  const formatWindSpeed = (speedMs: number | null | undefined): string => {
    if (speedMs === undefined || speedMs === null) return "—";
    const speedKmh = Math.round(speedMs * 3.6);
    return `${speedMs.toFixed(1)} m/s (${speedKmh} km/h)`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Haal huidige weersomstandigheden op voor de locatie of voer handmatig in indien nodig.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={fetchWeather} 
          className="btn btn-secondary" 
          disabled={loading}
        >
          {loading ? "Ophalen…" : "Haal weergegevens op"}
        </button>

        <button
          onClick={toggleManualOverride}
          className={`btn ${payload?.manualOverride ? "btn-primary" : "btn-outline"}`}
        >
          {payload?.manualOverride ? "Handmatige override aan" : "Handmatige override uit"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>Fout:</strong> {error}
        </div>
      )}

      {/* BLOCKING Conditions - Work must stop */}
      {isBlocking && blockingReasons.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛑</span>
            <div className="flex-1">
              <div className="font-bold text-red-900 mb-2 text-lg">
                GEVAAR: Werk moet worden stopgezet
              </div>
              <ul className="text-sm text-red-800 space-y-2">
                {blockingReasons.map((reason, idx) => (
                  <li key={idx} className="font-semibold">• {reason}</li>
                ))}
              </ul>
              <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-900">
                <strong>Actie vereist:</strong> Deze LMRA kan niet worden voortgezet onder deze weersomstandigheden.
                Wacht tot de omstandigheden verbeteren of stel het werk uit.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Warnings - Caution required */}
      {!isBlocking && safetyWarnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-yellow-900 mb-1">
                WAARSCHUWING: Onveilige werkomstandigheden
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                {safetyWarnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-yellow-800">
                Extra voorzichtigheid en veiligheidsmaatregelen zijn vereist.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Data Display */}
      {payload?.provider && (
        <div className="text-xs text-muted">
          Bron: {payload.provider} | Waarneming: {formatTimestamp(payload.observationTimestamp)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border rounded">
          <div className="text-xs text-muted mb-1">Temperatuur</div>
          {payload?.manualOverride ? (
            <input
              type="number"
              step="0.1"
              value={payload?.temperatureC ?? ""}
              onChange={(e) => handleManualChange({ temperatureC: parseFloat(e.target.value) || 0 })}
              className="input w-full text-sm"
              placeholder="°C"
            />
          ) : (
            <div className="text-lg font-semibold">
              {payload?.temperatureC !== undefined && payload?.temperatureC !== null 
                ? `${payload.temperatureC.toFixed(1)}°C` 
                : "—"}
            </div>
          )}
        </div>

        <div className="p-3 border rounded">
          <div className="text-xs text-muted mb-1">Luchtvochtigheid</div>
          {payload?.manualOverride ? (
            <input
              type="number"
              value={payload?.humidityPct ?? ""}
              onChange={(e) => handleManualChange({ humidityPct: parseInt(e.target.value) || 0 })}
              className="input w-full text-sm"
              placeholder="%"
            />
          ) : (
            <div className="text-lg font-semibold">
              {payload?.humidityPct !== undefined ? `${payload.humidityPct}%` : "—"}
            </div>
          )}
        </div>

        <div className="p-3 border rounded">
          <div className="text-xs text-muted mb-1">Wind</div>
          {payload?.manualOverride ? (
            <input
              type="number"
              step="0.1"
              value={payload?.windSpeedMs ?? ""}
              onChange={(e) => handleManualChange({ windSpeedMs: parseFloat(e.target.value) || 0 })}
              className="input w-full text-sm"
              placeholder="m/s"
            />
          ) : (
            <div className="text-lg font-semibold">
              {formatWindSpeed(payload?.windSpeedMs)}
            </div>
          )}
        </div>

        <div className="p-3 border rounded">
          <div className="text-xs text-muted mb-1">Neerslag</div>
          {payload?.manualOverride ? (
            <input
              type="number"
              step="0.1"
              value={payload?.precipitationMm ?? ""}
              onChange={(e) => handleManualChange({ precipitationMm: parseFloat(e.target.value) || 0 })}
              className="input w-full text-sm"
              placeholder="mm"
            />
          ) : (
            <div className="text-lg font-semibold">
              {payload?.precipitationMm !== undefined ? `${payload.precipitationMm} mm` : "—"}
            </div>
          )}
        </div>
      </div>

      {/* Weather Description and Notes */}
      <div className="space-y-2">
        <label className="block">
          <div className="text-xs text-muted mb-1">Weer beschrijving</div>
          <input
            type="text"
            value={payload?.weatherDescription ?? ""}
            onChange={(e) => handleManualChange({ weatherDescription: e.target.value })}
            placeholder="Bijv. Zwaar bewolkt, sneeuw, harde wind"
            className="input w-full"
            disabled={!payload?.manualOverride && !!payload?.weatherDescription}
          />
        </label>

        <label className="block">
          <div className="text-xs text-muted mb-1">Aantekeningen (handmatig)</div>
          <textarea
            value={payload?.manualNotes ?? ""}
            onChange={(e) => handleManualChange({ manualNotes: e.target.value })}
            className="textarea w-full"
            rows={3}
            placeholder="Extra opmerkingen over de weersomstandigheden..."
          />
        </label>
      </div>

      {/* Severity Indicator */}
      {payload?.severity && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Ernst niveau:</span>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              payload.severity === "clear"
                ? "bg-green-100 text-green-800"
                : payload.severity === "moderate"
                ? "bg-yellow-100 text-yellow-800"
                : payload.severity === "severe"
                ? "bg-orange-100 text-orange-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {payload.severity === "clear"
              ? "Helder"
              : payload.severity === "moderate"
              ? "Matig"
              : payload.severity === "severe"
              ? "Ernstig"
              : "Extreem"}
          </span>
        </div>
      )}
    </div>
  );
}
