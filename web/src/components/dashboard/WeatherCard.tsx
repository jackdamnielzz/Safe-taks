"use client";

import React, { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Thermometer,
  AlertTriangle,
  MapPin,
  RefreshCw,
  CloudOff,
} from "lucide-react";
import { locationService } from "@/lib/locationService";
import { WeatherConditions } from "@/lib/types/lmra";

interface WeatherCardProps {
  className?: string;
}

// Default fallback location: Amsterdam, Netherlands
const DEFAULT_LOCATION = {
  latitude: 52.3676,
  longitude: 4.9041,
  name: "Amsterdam",
};

/**
 * Get weather icon based on description and severity
 */
function getWeatherIcon(weather: WeatherConditions): React.ReactNode {
  const description = weather.weatherDescription?.toLowerCase() || "";
  const severity = weather.severity || "clear";

  if (description.includes("sneeuw") || description.includes("snow")) {
    return <CloudSnow className="w-10 h-10 text-blue-400" />;
  }
  if (description.includes("regen") || description.includes("rain")) {
    return <CloudRain className="w-10 h-10 text-blue-500" />;
  }
  if (description.includes("bewolkt") || description.includes("cloud")) {
    return <Cloud className="w-10 h-10 text-gray-400" />;
  }
  if (severity === "clear" || description.includes("helder") || description.includes("clear")) {
    return <Sun className="w-10 h-10 text-yellow-400" />;
  }

  return <Cloud className="w-10 h-10 text-gray-400" />;
}

/**
 * Get severity badge styling
 */
function getSeverityBadge(severity: string): { color: string; label: string } {
  switch (severity) {
    case "clear":
      return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Veilig" };
    case "moderate":
      return { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Let op" };
    case "severe":
      return { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Waarschuwing" };
    case "extreme":
      return { color: "bg-red-50 text-red-700 border-red-200", label: "Gevaar" };
    default:
      return { color: "bg-slate-50 text-slate-700 border-slate-200", label: "Onbekend" };
  }
}

export function WeatherCard({ className = "" }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION.name);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        throw new Error("Kon weerdata niet ophalen");
      }

      const data = await response.json();
      
      // Transform the response to WeatherConditions format
      const weatherData: WeatherConditions = {
        provider: data.provider || "OpenWeather",
        observationTimestamp: new Date(data.observationTimestamp),
        temperatureC: data.temperatureC,
        humidityPct: data.humidityPct,
        windSpeedMs: data.windSpeedMs,
        weatherDescription: data.weatherDescription,
        severity: data.severity || "clear",
      };

      setWeather(weatherData);
      setError(null);
    } catch (err) {
      // Suppress noisy console error in UI; store friendly message instead
      setError("Weer niet beschikbaar");
    }
  };

  const loadWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get user's location via locationService
      const locationResponse = await locationService.getCurrentLocation({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Accept cached location up to 5 minutes old
      });

      if (locationResponse.success && locationResponse.location) {
        const { latitude, longitude } = locationResponse.location.coordinates;
        setLocationName("Uw locatie");
        await fetchWeather(latitude, longitude);
      } else {
        // Use fallback location
        setLocationName(DEFAULT_LOCATION.name);
        await fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      }
    } catch (err) {
      // Use fallback location on any error
      setLocationName(DEFAULT_LOCATION.name);
      await fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWeather();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadWeather();
    
    // Refresh weather every 15 minutes
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-5 bg-white/80 backdrop-blur-glass border border-slate-200/50 shadow-soft ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-500 opacity-90" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="h-6 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-5 bg-white/80 backdrop-blur-glass border border-slate-200/50 shadow-soft ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 to-slate-400 opacity-90" />
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100">
            <CloudOff className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-500">Weergegevens</div>
            <div className="text-slate-600">{error || "Niet beschikbaar"}</div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Vernieuwen"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    );
  }

  const windKmh = weather.windSpeedMs ? Math.round(weather.windSpeedMs * 3.6) : null;
  const severityBadge = getSeverityBadge(weather.severity || "clear");
  const showWarning = weather.severity === "severe" || weather.severity === "extreme";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-glass border border-sky-200/50 shadow-soft hover:shadow-float transition-all duration-300 ${className}`}>
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-500 opacity-90" />
      
      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Weather icon */}
          <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
            {getWeatherIcon(weather)}
          </div>

          {/* Weather info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{locationName}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="Vernieuwen"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Temperature */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {weather.temperatureC !== undefined && weather.temperatureC !== null
                  ? `${Math.round(weather.temperatureC)}°`
                  : "—"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${severityBadge.color}`}>
                {severityBadge.label}
              </span>
            </div>

            {/* Weather description */}
            <div className="text-sm text-slate-600 capitalize mb-2">
              {weather.weatherDescription || "Geen beschrijving"}
            </div>

            {/* Additional metrics */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {windKmh !== null && (
                <div className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span>{windKmh} km/h</span>
                </div>
              )}
              {weather.humidityPct !== undefined && (
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>{weather.humidityPct}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety warning for severe/extreme weather */}
        {showWarning && (
          <div className={`mt-4 p-3 rounded-xl ${weather.severity === "extreme" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${weather.severity === "extreme" ? "text-red-600" : "text-amber-600"}`} />
              <div className="flex-1">
                <div className={`text-sm font-semibold ${weather.severity === "extreme" ? "text-red-800" : "text-amber-800"}`}>
                  {weather.severity === "extreme" ? "Werk stopzetten" : "Extra voorzichtigheid"}
                </div>
                <div className={`text-xs ${weather.severity === "extreme" ? "text-red-700" : "text-amber-700"}`}>
                  {weather.severity === "extreme"
                    ? "Extreme weersomstandigheden. Buitenwerk niet toegestaan."
                    : "Ernstige weersomstandigheden. Neem extra veiligheidsmaatregelen."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}