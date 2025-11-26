/**
 * Weather Service Tests
 * Tests for OpenWeather API integration and safety checks
 */

import { WeatherService, getWeatherService } from "../weatherService";
import { WeatherConditions } from "../types/lmra";
import { Timestamp } from "firebase/firestore";

// Mock fetch globally
global.fetch = jest.fn();

describe("WeatherService", () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService({
      apiKey: "test_api_key_12345",
    });
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe("getCurrentWeather", () => {
    it("should fetch weather data successfully", async () => {
      const mockResponse = {
        main: {
          temp: 20.5,
          humidity: 65,
        },
        visibility: 10000,
        wind: {
          speed: 5.2,
        },
        weather: [
          {
            main: "Clouds",
            description: "bewolkt",
            icon: "04d",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await weatherService.getCurrentWeather(52.0907, 5.1214);

      expect(result).toMatchObject({
        provider: "OpenWeather",
        temperatureC: 20.5,
        humidityPct: 65,
        windSpeedMs: 5.2,
        weatherDescription: "bewolkt",
        severity: "clear",
      });
      expect(result.observationTimestamp).toBeInstanceOf(Timestamp);
    });

    it("should throw error when API key is missing", async () => {
      const serviceWithoutKey = new WeatherService({ apiKey: "" });

      await expect(serviceWithoutKey.getCurrentWeather(52.0907, 5.1214)).rejects.toThrow(
        "OpenWeather API key not configured"
      );
    });

    it("should throw error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(weatherService.getCurrentWeather(52.0907, 5.1214)).rejects.toThrow(
        "Weather API error: 401 Unauthorized"
      );
    });
  });

  describe("getCurrentWeatherWithRetry", () => {
    it("should retry on failure with exponential backoff", async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            main: { temp: 15, humidity: 70 },
            wind: { speed: 3 },
            weather: [{ main: "Clear", description: "helder", icon: "01d" }],
          }),
        });

      const result = await weatherService.getCurrentWeatherWithRetry(52.0907, 5.1214, 3);

      expect(result.temperatureC).toBe(15);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max retries", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(weatherService.getCurrentWeatherWithRetry(52.0907, 5.1214, 2)).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("calculateSeverity", () => {
    it("should return 'clear' for good weather", () => {
      const data = {
        main: { temp: 20, humidity: 60 },
        wind: { speed: 5 },
        weather: [{ main: "Clear", description: "helder", icon: "01d" }],
      };

      const result = (weatherService as any).calculateSeverity(data);
      expect(result).toBe("clear");
    });

    it("should return 'moderate' for rain", () => {
      const data = {
        main: { temp: 15, humidity: 80 },
        wind: { speed: 8 },
        weather: [{ main: "Rain", description: "regen", icon: "10d" }],
      };

      const result = (weatherService as any).calculateSeverity(data);
      expect(result).toBe("moderate");
    });

    it("should return 'severe' for snow", () => {
      const data = {
        main: { temp: -2, humidity: 90 },
        wind: { speed: 12 },
        weather: [{ main: "Snow", description: "sneeuw", icon: "13d" }],
      };

      const result = (weatherService as any).calculateSeverity(data);
      expect(result).toBe("severe");
    });

    it("should return 'extreme' for thunderstorm", () => {
      const data = {
        main: { temp: 18, humidity: 85 },
        wind: { speed: 15 },
        weather: [{ main: "Thunderstorm", description: "onweer", icon: "11d" }],
      };

      const result = (weatherService as any).calculateSeverity(data);
      expect(result).toBe("extreme");
    });

    it("should return 'extreme' for high wind", () => {
      const data = {
        main: { temp: 20, humidity: 60 },
        wind: { speed: 25 },
        weather: [{ main: "Clear", description: "helder", icon: "01d" }],
      };

      const result = (weatherService as any).calculateSeverity(data);
      expect(result).toBe("extreme");
    });
  });

  describe("isSafeForWork", () => {
    it("should return safe for good weather", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 5,
        weatherDescription: "helder",
        severity: "clear",
      };

      const result = weatherService.isSafeForWork(weather);

      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.blocking).toBe(false);
      expect(result.blockingReasons).toHaveLength(0);
    });

    it("should warn for high wind", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 12,
        weatherDescription: "winderig",
        severity: "moderate",
      };

      const result = weatherService.isSafeForWork(weather);

      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("windsnelheid");
      expect(result.blocking).toBe(false);
    });

    it("should block for extreme wind", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 18,
        weatherDescription: "storm",
        severity: "extreme",
      };

      const result = weatherService.isSafeForWork(weather);

      expect(result.safe).toBe(false);
      expect(result.blocking).toBe(true);
      expect(result.blockingReasons.length).toBeGreaterThan(0);
      expect(result.blockingReasons[0]).toContain("Extreme wind");
    });

    it("should block for thunderstorm", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 18,
        humidityPct: 85,
        windSpeedMs: 10,
        weatherDescription: "onweer",
        severity: "extreme",
      };

      const result = weatherService.isSafeForWork(weather);

      expect(result.safe).toBe(false);
      expect(result.blocking).toBe(true);
      expect(result.blockingReasons.some((r) => r.includes("Onweer"))).toBe(true);
    });

    it("should block for extreme temperature", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 42,
        humidityPct: 40,
        windSpeedMs: 5,
        weatherDescription: "helder",
        severity: "extreme",
      };

      const result = weatherService.isSafeForWork(weather);

      expect(result.safe).toBe(false);
      expect(result.blocking).toBe(true);
      expect(result.blockingReasons.some((r) => r.includes("Extreme hitte"))).toBe(true);
    });

    it("should apply stricter limits for work at height", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 9,
        weatherDescription: "winderig",
        severity: "moderate",
      };

      const result = weatherService.isSafeForWork(weather, undefined, "height");

      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.includes("werken op hoogte"))).toBe(true);
    });

    it("should warn for rain during electrical work", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 15,
        humidityPct: 80,
        windSpeedMs: 5,
        precipitationMm: 2,
        weatherDescription: "regen",
        severity: "moderate",
      };

      const result = weatherService.isSafeForWork(weather, undefined, "electrical");

      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.includes("elektrisch werk"))).toBe(true);
    });
  });

  describe("caching", () => {
    it("should cache weather data", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 5,
        weatherDescription: "helder",
        severity: "clear",
      };

      weatherService.cacheWeather("52.09_5.12", weather);

      const cached = weatherService.getCachedWeather("52.09_5.12");
      expect(cached).toMatchObject({
        temperatureC: 20,
        humidityPct: 60,
      });
    });

    it("should return null for expired cache", () => {
      const weather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 5,
        weatherDescription: "helder",
        severity: "clear",
      };

      // Mock old timestamp
      const oldData = JSON.stringify({
        ...weather,
        fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      });
      localStorage.setItem("weather_52.09_5.12", oldData);

      const cached = weatherService.getCachedWeather("52.09_5.12");
      expect(cached).toBeNull();
    });

    it("should use cache in getWeatherWithCache", async () => {
      const mockWeather: WeatherConditions = {
        provider: "OpenWeather",
        observationTimestamp: Timestamp.now(),
        temperatureC: 20,
        humidityPct: 60,
        windSpeedMs: 5,
        weatherDescription: "helder",
        severity: "clear",
      };

      // Pre-populate cache
      weatherService.cacheWeather("52.09_5.12", mockWeather);

      const result = await weatherService.getWeatherWithCache(52.09, 5.12);

      expect(result.temperatureC).toBe(20);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("getWeatherService singleton", () => {
    it("should return same instance", () => {
      const instance1 = getWeatherService();
      const instance2 = getWeatherService();

      expect(instance1).toBe(instance2);
    });
  });
});
