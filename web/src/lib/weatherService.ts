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
    // API key should come from environment variable
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
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
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenWeatherResponse = await response.json();

      return this.transformWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
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
      temperature: Math.round(data.main.temp * 10) / 10, // Round to 1 decimal
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // m/s to km/h
      visibility: Math.round((data.visibility / 1000) * 10) / 10, // meters to km
      conditions: data.weather[0]?.main || "Unknown",
      description: data.weather[0]?.description || "",
      apiSource: "OpenWeather",
      fetchedAt: Timestamp.now(),
      iconCode: data.weather[0]?.icon,
    };
  }

  /**
   * Check if weather conditions are safe for work
   */
  isSafeForWork(
    weather: WeatherConditions,
    limits?: {
      maxWindSpeed?: number;
      minVisibility?: number;
      maxTemperature?: number;
      minTemperature?: number;
    }
  ): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const defaultLimits = {
      maxWindSpeed: 40, // km/h
      minVisibility: 1, // km
      maxTemperature: 40, // °C
      minTemperature: -10, // °C
      ...limits,
    };

    if (weather.windSpeed > defaultLimits.maxWindSpeed) {
      warnings.push(`Hoge windsnelheid: ${weather.windSpeed} km/h`);
    }

    if (weather.visibility < defaultLimits.minVisibility) {
      warnings.push(`Slecht zicht: ${weather.visibility} km`);
    }

    if (weather.temperature > defaultLimits.maxTemperature) {
      warnings.push(`Extreme hitte: ${weather.temperature}°C`);
    }

    if (weather.temperature < defaultLimits.minTemperature) {
      warnings.push(`Extreme koude: ${weather.temperature}°C`);
    }

    // Check for severe weather conditions
    const severeConditions = ["Thunderstorm", "Snow", "Extreme"];
    if (severeConditions.some((cond) => weather.conditions.includes(cond))) {
      warnings.push(`Slecht weer: ${weather.description}`);
    }

    return {
      safe: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get weather description in Dutch
   */
  getWeatherDescriptionNL(weather: WeatherConditions): string {
    const temp = Math.round(weather.temperature);
    const wind = Math.round(weather.windSpeed);

    return `${weather.description}, ${temp}°C, wind ${wind} km/h`;
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
