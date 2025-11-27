/**
 * Weather Service
 * Integrates with OpenWeather API for environmental condition assessment
 * Task 5.6: Environmental Condition Assessment
 */

import { WeatherConditions } from "./types/lmra";
import { Timestamp } from "firebase/firestore";

// ============================================================================
// TYPES
// ============================================================================

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

interface WeatherServiceConfig {
  apiKey?: string;
  units?: "metric" | "imperial";
  language?: "nl" | "en";
}

// ============================================================================
// WEATHER SERVICE
// ============================================================================

export class WeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";
  private units: "metric" | "imperial";
  private language: string;

  constructor(config: WeatherServiceConfig = {}) {
    // Prefer server-side API key. Fall back to NEXT_PUBLIC for local/dev if explicitly set.
    // Using a server-only env var avoids leaking the key to the client.
    this.apiKey =
      config.apiKey ||
      process.env.OPENWEATHER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
      "";
    this.units = config.units || "metric";
    this.language = config.language || "nl";
  }

  /**
   * Get current weather conditions by coordinates
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherConditions> {
    if (!this.apiKey) {
      throw new Error("OpenWeather API key not configured");
    }

    const url = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&units=${this.units}&lang=${this.language}&appid=${this.apiKey}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Preserve upstream status/message for tests and diagnostics
        // Some test mocks don't implement response.text(), so guard against that.
        let text = "";
        try {
          if (typeof (response as any).text === "function") {
            text = await (response as any).text();
          }
        } catch (e) {
          // ignore read errors from mock responses
          text = "";
        }
        const statusText = response.statusText || "";
        const message = `Weather API error: ${response.status} ${statusText}${text ? ` - ${text}` : ""}`;
        throw new Error(message);
      }

      const data: OpenWeatherResponse = await response.json();

      return this.transformWeatherData(data);
    } catch (error: any) {
      console.error("Error fetching weather:", error);
      // If the upstream error contains a descriptive message, rethrow it to keep tests deterministic
      if (error?.message && error.message.startsWith("Weather API error")) {
        throw error;
      }
      throw new Error("Failed to fetch weather conditions");
    }
  }

  /**
   * Get weather with retry logic
   */
  async getCurrentWeatherWithRetry(
    latitude: number,
    longitude: number,
    maxRetries: number = 3
  ): Promise<WeatherConditions> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.getCurrentWeather(latitude, longitude);
      } catch (error) {
        lastError = error as Error;

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Failed to fetch weather after retries");
  }

  /**
   * Transform OpenWeather API response to our WeatherConditions type
   */
  private transformWeatherData(data: OpenWeatherResponse): WeatherConditions {
    return {
      provider: "OpenWeather",
      observationTimestamp: Timestamp.now(),
      temperatureC: Math.round(data.main.temp * 10) / 10, // Round to 1 decimal
      humidityPct: data.main.humidity,
      windSpeedMs: data.wind.speed, // Keep in m/s as per type definition
      weatherDescription: data.weather[0]?.description || "",
      severity: this.calculateSeverity(data),
    };
  }

  /**
   * Calculate weather severity based on conditions
   */
  private calculateSeverity(
    data: OpenWeatherResponse
  ): "clear" | "moderate" | "severe" | "extreme" {
    const windSpeed = data.wind.speed;
    const temp = data.main.temp;
    const weatherMain = data.weather[0]?.main || "";

    // Extreme conditions
    if (weatherMain === "Thunderstorm" || windSpeed > 20 || temp > 40 || temp < -15) {
      return "extreme";
    }

    // Severe conditions
    if (weatherMain === "Snow" || windSpeed > 15 || temp > 35 || temp < -10) {
      return "severe";
    }

    // Moderate conditions
    if (weatherMain === "Rain" || windSpeed > 10 || temp > 30 || temp < -5) {
      return "moderate";
    }

    return "clear";
  }

  /**
   * Check if weather conditions are safe for work
   * Enhanced with blocking conditions and detailed warnings
   */
  isSafeForWork(
    weather: WeatherConditions,
    limits?: {
      maxWindSpeedMs?: number;
      maxTemperature?: number;
      minTemperature?: number;
    },
    workType?: "general" | "height" | "electrical" | "confined_space" | "hot_work"
  ): {
    safe: boolean;
    warnings: string[];
    blocking: boolean;
    blockingReasons: string[];
  } {
    const warnings: string[] = [];
    const blockingReasons: string[] = [];
    const defaultLimits = {
      maxWindSpeedMs: 11, // ~40 km/h
      maxTemperature: 40, // °C
      minTemperature: -10, // °C
      ...limits,
    };

    // Work-type specific limits
    const workTypeLimits = {
      height: { maxWindSpeedMs: 8 }, // 60 km/h for work at height
      electrical: { maxWindSpeedMs: 11, noRain: true },
      confined_space: { maxTemperature: 35, minTemperature: -5 },
      hot_work: { maxWindSpeedMs: 15, noRain: true },
    };

    const effectiveLimits =
      workType && workType !== "general"
        ? { ...defaultLimits, ...workTypeLimits[workType] }
        : defaultLimits;

    // BLOCKING CONDITIONS (work must stop)

    // 1. Extreme wind (>60 km/h / 16.7 m/s)
    if (weather.windSpeedMs && weather.windSpeedMs > 16.7) {
      const windKmh = Math.round(weather.windSpeedMs * 3.6);
      blockingReasons.push(`Extreme wind: ${windKmh} km/h (limiet: 60 km/h)`);
    }

    // 2. Thunderstorm
    if (
      weather.weatherDescription?.toLowerCase().includes("onweer") ||
      weather.weatherDescription?.toLowerCase().includes("thunder")
    ) {
      blockingReasons.push("Onweer gedetecteerd - alle buitenwerk moet worden stopgezet");
    }

    // 3. Extreme temperature
    if (weather.temperatureC !== null && weather.temperatureC !== undefined) {
      if (weather.temperatureC > 40) {
        blockingReasons.push(`Extreme hitte: ${weather.temperatureC}°C (limiet: 40°C)`);
      }
      if (weather.temperatureC < -15) {
        blockingReasons.push(`Extreme koude: ${weather.temperatureC}°C (limiet: -15°C)`);
      }
    }

    // 4. Extreme severity
    if (weather.severity === "extreme") {
      blockingReasons.push("Extreme weersomstandigheden - werk moet worden stopgezet");
    }

    // WARNING CONDITIONS (caution required)

    // Wind warnings
    if (weather.windSpeedMs && weather.windSpeedMs > effectiveLimits.maxWindSpeedMs) {
      const windKmh = Math.round(weather.windSpeedMs * 3.6);
      if (workType === "height") {
        warnings.push(
          `Hoge wind voor werken op hoogte: ${windKmh} km/h (limiet: ${Math.round(effectiveLimits.maxWindSpeedMs * 3.6)} km/h)`
        );
      } else {
        warnings.push(`Hoge windsnelheid: ${windKmh} km/h`);
      }
    }

    // Temperature warnings
    if (weather.temperatureC !== null && weather.temperatureC !== undefined) {
      if (weather.temperatureC > effectiveLimits.maxTemperature) {
        warnings.push(
          `Hoge temperatuur: ${weather.temperatureC}°C - extra pauzes en hydratatie vereist`
        );
      }
      if (weather.temperatureC < effectiveLimits.minTemperature) {
        warnings.push(
          `Lage temperatuur: ${weather.temperatureC}°C - extra beschermende kleding vereist`
        );
      }
    }

    // Rain warnings for electrical/hot work
    if (
      (workType === "electrical" || workType === "hot_work") &&
      (weather.weatherDescription?.toLowerCase().includes("regen") ||
        weather.weatherDescription?.toLowerCase().includes("rain") ||
        (weather.precipitationMm && weather.precipitationMm > 0))
    ) {
      warnings.push(
        `Regen gedetecteerd - ${workType === "electrical" ? "elektrisch werk" : "heet werk"} niet toegestaan`
      );
    }

    // Severe weather warning
    if (weather.severity === "severe") {
      warnings.push(`Ernstige weersomstandigheden: ${weather.weatherDescription}`);
    }

    // Moderate weather info
    if (weather.severity === "moderate" && warnings.length === 0) {
      warnings.push(
        `Matige weersomstandigheden: ${weather.weatherDescription} - extra voorzichtigheid vereist`
      );
    }

    return {
      safe: warnings.length === 0 && blockingReasons.length === 0,
      warnings,
      blocking: blockingReasons.length > 0,
      blockingReasons,
    };
  }

  /**
   * Get weather description in Dutch
   */
  getWeatherDescriptionNL(weather: WeatherConditions): string {
    const temp = weather.temperatureC ? Math.round(weather.temperatureC) : "?";
    const windKmh = weather.windSpeedMs ? Math.round(weather.windSpeedMs * 3.6) : "?";

    return `${weather.weatherDescription}, ${temp}°C, wind ${windKmh} km/h`;
  }

  /**
   * Get cached weather (from localStorage for offline support)
   */
  getCachedWeather(locationKey: string): WeatherConditions | null {
    try {
      const cached = localStorage.getItem(`weather_${locationKey}`);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const age = Date.now() - new Date(data.fetchedAt).getTime();

      // Cache valid for 1 hour
      if (age > 60 * 60 * 1000) {
        localStorage.removeItem(`weather_${locationKey}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error reading cached weather:", error);
      return null;
    }
  }

  /**
   * Cache weather data
   */
  cacheWeather(locationKey: string, weather: WeatherConditions): void {
    try {
      localStorage.setItem(`weather_${locationKey}`, JSON.stringify(weather));
    } catch (error) {
      console.error("Error caching weather:", error);
    }
  }

  /**
   * Get weather with cache support
   */
  async getWeatherWithCache(latitude: number, longitude: number): Promise<WeatherConditions> {
    const locationKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

    // Try cache first
    const cached = this.getCachedWeather(locationKey);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const weather = await this.getCurrentWeatherWithRetry(latitude, longitude);

    // Cache for future use
    this.cacheWeather(locationKey, weather);

    return weather;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let weatherServiceInstance: WeatherService | null = null;

/**
 * Get singleton weather service instance
 */
export function getWeatherService(config?: WeatherServiceConfig): WeatherService {
  if (!weatherServiceInstance) {
    weatherServiceInstance = new WeatherService(config);
  }
  return weatherServiceInstance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get weather icon URL from code
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Get weather severity level
 */
export function getWeatherSeverity(
  weather: WeatherConditions
): "low" | "medium" | "high" | "extreme" {
  const { safe, warnings } = getWeatherService().isSafeForWork(weather);

  if (!safe) {
    if (warnings.length >= 3) return "extreme";
    if (warnings.length >= 2) return "high";
    return "medium";
  }

  return "low";
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`;
}

/**
 * Format wind speed for display
 */
export function formatWindSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

/**
 * Format visibility for display
 */
export function formatVisibility(visibility: number): string {
  return `${visibility.toFixed(1)} km`;
}
