/**
 * WeatherDisplay Component
 * Reusable component for displaying weather conditions with icons
 * Used in LMRA Step 3 and completed LMRA views
 */

import React from "react";
import { WeatherConditions } from "@/lib/types/lmra";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface WeatherDisplayProps {
  weather: WeatherConditions;
  showWarnings?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Get weather icon based on description and severity
 */
function getWeatherIcon(weather: WeatherConditions): React.ReactNode {
  const description = weather.weatherDescription?.toLowerCase() || "";
  const severity = weather.severity || "clear";

  if (description.includes("sneeuw") || description.includes("snow")) {
    return <CloudSnow className="w-8 h-8 text-blue-400" />;
  }
  if (description.includes("regen") || description.includes("rain")) {
    return <CloudRain className="w-8 h-8 text-blue-500" />;
  }
  if (description.includes("bewolkt") || description.includes("cloud")) {
    return <Cloud className="w-8 h-8 text-gray-400" />;
  }
  if (severity === "clear" || description.includes("helder") || description.includes("clear")) {
    return <Sun className="w-8 h-8 text-yellow-400" />;
  }

  // Default to cloud icon
  return <Cloud className="w-8 h-8 text-gray-400" />;
}

/**
 * Get severity badge color
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "clear":
      return "bg-green-100 text-green-800 border-green-200";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "severe":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "extreme":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get severity label in Dutch
 */
function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "clear":
      return "Helder";
    case "moderate":
      return "Matig";
    case "severe":
      return "Ernstig";
    case "extreme":
      return "Extreem";
    default:
      return "Onbekend";
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: any): string {
  if (!timestamp) return "—";
  
  try {
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "object" && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
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
}

/**
 * WeatherDisplay Component
 */
export function WeatherDisplay({ 
  weather, 
  showWarnings = true, 
  compact = false,
  className = "" 
}: WeatherDisplayProps) {
  const windKmh = weather.windSpeedMs ? Math.round(weather.windSpeedMs * 3.6) : null;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {getWeatherIcon(weather)}
        <div className="flex-1">
          <div className="font-medium">{weather.weatherDescription || "Geen data"}</div>
          <div className="text-sm text-muted">
            {weather.temperatureC !== undefined && weather.temperatureC !== null && `${weather.temperatureC.toFixed(1)}°C`}
            {windKmh && ` • ${windKmh} km/h`}
          </div>
        </div>
        {weather.severity && (
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(weather.severity)}`}>
            {getSeverityLabel(weather.severity)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with icon and description */}
      <div className="flex items-center gap-3">
        {getWeatherIcon(weather)}
        <div className="flex-1">
          <div className="text-lg font-semibold">{weather.weatherDescription || "Geen weerdata"}</div>
          {weather.provider && (
            <div className="text-xs text-muted">
              Bron: {weather.provider} • {formatTimestamp(weather.observationTimestamp)}
            </div>
          )}
        </div>
        {weather.severity && (
          <span className={`px-3 py-1 rounded text-sm font-semibold border ${getSeverityColor(weather.severity)}`}>
            {getSeverityLabel(weather.severity)}
          </span>
        )}
      </div>

      {/* Weather metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-muted" />
            <div className="text-xs text-muted">Temperatuur</div>
          </div>
          <div className="text-xl font-semibold">
            {weather.temperatureC !== undefined && weather.temperatureC !== null
              ? `${weather.temperatureC.toFixed(1)}°C`
              : "—"}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-muted" />
            <div className="text-xs text-muted">Luchtvochtigheid</div>
          </div>
          <div className="text-xl font-semibold">
            {weather.humidityPct !== undefined ? `${weather.humidityPct}%` : "—"}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-muted" />
            <div className="text-xs text-muted">Windsnelheid</div>
          </div>
          <div className="text-xl font-semibold">
            {windKmh !== null ? `${windKmh} km/h` : "—"}
          </div>
          {weather.windSpeedMs !== undefined && weather.windSpeedMs !== null && (
            <div className="text-xs text-muted mt-1">
              {weather.windSpeedMs.toFixed(1)} m/s
            </div>
          )}
        </div>

        {/* Precipitation */}
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-1">
            <CloudRain className="w-4 h-4 text-muted" />
            <div className="text-xs text-muted">Neerslag</div>
          </div>
          <div className="text-xl font-semibold">
            {weather.precipitationMm !== undefined ? `${weather.precipitationMm} mm` : "0 mm"}
          </div>
        </div>
      </div>

      {/* Safety warnings */}
      {showWarnings && weather.severity && weather.severity !== "clear" && (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-900 mb-1">
                Waarschuwing: Onveilige weersomstandigheden
              </div>
              <div className="text-sm text-yellow-800">
                {weather.severity === "moderate" && "Let op: Matige weersomstandigheden. Extra voorzichtigheid vereist."}
                {weather.severity === "severe" && "Waarschuwing: Ernstige weersomstandigheden. Overweeg werk uit te stellen."}
                {weather.severity === "extreme" && "GEVAAR: Extreme weersomstandigheden. Werk moet worden stopgezet."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual notes */}
      {weather.manualNotes && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs text-blue-700 font-semibold mb-1">Handmatige aantekeningen:</div>
          <div className="text-sm text-blue-900">{weather.manualNotes}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact weather badge for lists
 */
export function WeatherBadge({ weather }: { weather: WeatherConditions }) {
  const windKmh = weather.windSpeedMs ? Math.round(weather.windSpeedMs * 3.6) : null;
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border rounded-full text-sm">
      {getWeatherIcon(weather)}
      <span className="font-medium">
        {weather.temperatureC !== undefined && weather.temperatureC !== null && `${weather.temperatureC.toFixed(0)}°C`}
      </span>
      {windKmh && (
        <>
          <span className="text-muted">•</span>
          <span className="text-muted">{windKmh} km/h</span>
        </>
      )}
      {weather.severity && weather.severity !== "clear" && (
        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(weather.severity)}`}>
          {getSeverityLabel(weather.severity)}
        </span>
      )}
    </div>
  );
}