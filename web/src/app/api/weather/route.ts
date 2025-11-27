/**
 * Weather API Endpoint
 * Server-side proxy for OpenWeather API calls
 * Benefits:
 * - Hides API key from client
 * - Enables server-side caching
 * - Better rate limiting control
 * - Request logging and monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { getWeatherService } from "@/lib/weatherService";

export const runtime = "edge";

// Simple in-memory cache for edge runtime
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/weather?lat={lat}&lon={lon}
 * Fetch current weather conditions by coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    // Validate parameters
    if (!lat || !lon) {
      return NextResponse.json({ error: "Missing required parameters: lat, lon" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates: lat and lon must be numbers" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
      });
    }

    // Fetch from OpenWeather API
    const weatherService = getWeatherService();
    const weather = await weatherService.getCurrentWeatherWithRetry(latitude, longitude);

    // Convert Timestamp to ISO string for JSON serialization
    const weatherData = {
      ...weather,
      observationTimestamp:
        weather.observationTimestamp instanceof Date
          ? weather.observationTimestamp.toISOString()
          : (weather.observationTimestamp as any)?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const oldestKey = Array.from(cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      cache.delete(oldestKey);
    }

    return NextResponse.json({
      ...weatherData,
      cached: false,
    });
  } catch (error: any) {
    console.error("Weather API error:", error);

    // Handle specific error types
    if (error.message?.includes("API key not configured")) {
      return NextResponse.json({ error: "Weather service not configured" }, { status: 503 });
    }

    if (error.message?.includes("401")) {
      return NextResponse.json({ error: "Weather service authentication failed" }, { status: 503 });
    }

    if (error.message?.includes("429")) {
      return NextResponse.json(
        { error: "Weather service rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 });
  }
}
