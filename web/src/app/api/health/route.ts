import { NextRequest, NextResponse } from "next/server";

interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    database: "connected" | "disconnected" | "error";
    authentication: "operational" | "degraded" | "down";
    storage: "available" | "unavailable" | "error";
  };
  uptime: number;
  environment: string;
}

const startTime = Date.now();

/**
 * Health Check Endpoint
 *
 * This endpoint is used by uptime monitoring services (like UptimeRobot)
 * to check if the application is healthy and operational.
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service is unhealthy
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  try {
    // Calculate uptime in seconds
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    // Check various services
    const services = await checkServices();

    // Determine overall health
    const isHealthy =
      services.database !== "error" &&
      services.authentication !== "down" &&
      services.storage !== "error";

    const healthData: HealthCheckResponse = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      services,
      uptime,
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
        services: {
          database: "error",
          authentication: "down",
          storage: "error",
        },
        uptime: Math.floor((Date.now() - startTime) / 1000),
        environment: process.env.NODE_ENV || "development",
        error: error instanceof Error ? error.message : "Unknown error",
      } as HealthCheckResponse & { error: string },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}

/**
 * Check the health of various services
 */
async function checkServices() {
  const services: {
    database: "connected" | "disconnected" | "error";
    authentication: "operational" | "degraded" | "down";
    storage: "available" | "unavailable" | "error";
  } = {
    database: "connected",
    authentication: "operational",
    storage: "available",
  };

  try {
    // Check Firebase connection (basic check)
    // In a real implementation, you would make actual calls to Firebase
    // For now, we'll assume services are operational if environment variables exist

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      services.database = "disconnected";
      services.authentication = "degraded";
      services.storage = "unavailable";
    }

    // Add more specific service checks here as needed
    // Example:
    // - Check Firebase Firestore connection
    // - Check Firebase Auth service
    // - Check Firebase Storage
    // - Check external API dependencies
  } catch (error) {
    console.error("Service check failed:", error);
    services.database = "error";
    services.authentication = "down";
    services.storage = "error";
  }

  return services;
}

/**
 * Simple ping endpoint for basic uptime checks
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
