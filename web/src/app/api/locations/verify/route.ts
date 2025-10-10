/**
 * API Route for Location Verification
 * Integrates GPS location verification with TRA system
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/server-helpers";
import { z } from "zod";
import {
  LocationVerification,
  LocationVerificationRequest,
  LocationVerificationResponse,
} from "@/lib/locationService";
import { locationService } from "@/lib/locationService";
import { writeAuditLog } from "@/lib/audit";
import { Errors } from "@/lib/api/errors";

// Request validation schema
const LocationVerifySchema = z.object({
  traId: z.string().optional(),
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  requiredAccuracy: z.number().min(1).max(100).optional(),
  timeout: z.number().min(1000).max(60000).optional(),
  enableHighAccuracy: z.boolean().optional(),
  maximumAge: z.number().min(0).optional(),
  verificationMethod: z.enum(["auto", "manual"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireOrgAuth(request);
    if (!auth) {
      return Errors.unauthorized();
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = LocationVerifySchema.safeParse(body);

    if (!validationResult.success) {
      return Errors.validation(validationResult.error);
    }

    const {
      traId,
      projectId,
      sessionId,
      requiredAccuracy,
      timeout,
      enableHighAccuracy,
      maximumAge,
      verificationMethod,
      notes,
    } = validationResult.data;

    // Verify location
    const locationRequest: LocationVerificationRequest = {
      traId,
      projectId,
      sessionId,
      requiredAccuracy,
      timeout: timeout || 30000, // 30 seconds default
      enableHighAccuracy: enableHighAccuracy ?? true,
      maximumAge,
      verificationMethod,
    };

    const locationResponse: LocationVerificationResponse =
      await locationService.getCurrentLocation(locationRequest);

    // If verification failed, return error
    if (!locationResponse.success || !locationResponse.location) {
      return NextResponse.json(
        {
          success: false,
          error: locationResponse.error,
          verificationTime: locationResponse.verificationTime,
        },
        { status: 400 }
      );
    }

    const location = locationResponse.location;

    // Create audit log entry
    await writeAuditLog(auth.orgId, location.id, auth.uid, "verify", {
      resourceType: "location",
      accuracy: location.coordinates.accuracy,
      verificationScore: location.verificationScore,
      traId,
      projectId,
      sessionId,
      verificationMethod,
      notes,
    });

    // Store location verification in Firestore (optional)
    // In a real implementation, you might want to store this for reporting or compliance
    // await storeLocationVerification(auth.orgId, location);

    // Return success response
    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        coordinates: location.coordinates,
        verificationStatus: location.verificationStatus,
        verificationScore: location.verificationScore,
        timestamps: {
          capturedAt: location.timestamps.capturedAt.toISOString(),
          expiresAt: location.timestamps.expiresAt?.toISOString(),
          lastVerifiedAt: location.timestamps.lastVerifiedAt?.toISOString(),
        },
        metadata: {
          source: location.metadata.source,
          verificationMethod: location.metadata.verificationMethod,
          isOffline: location.metadata.isOffline,
        },
      },
      verificationTime: locationResponse.verificationTime,
    });
  } catch (error) {
    console.error("Location verification error:", error);
    return Errors.serverError(new Error("Failed to verify location"));
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireOrgAuth(request);
    if (!auth) {
      return Errors.unauthorized();
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const traId = searchParams.get("traId");
    const projectId = searchParams.get("projectId");
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get cached locations for the user
    const cachedLocations = locationService
      .getCachedLocations()
      .filter((loc) => {
        // Filter by query parameters
        if (traId && loc.metadata.traId !== traId) return false;
        if (projectId && loc.metadata.projectId !== projectId) return false;
        if (sessionId && loc.metadata.sessionId !== sessionId) return false;
        return true;
      })
      .slice(0, limit);

    // Return cached locations
    return NextResponse.json({
      success: true,
      locations: cachedLocations.map((loc) => ({
        id: loc.id,
        coordinates: loc.coordinates,
        verificationStatus: loc.verificationStatus,
        verificationScore: loc.verificationScore,
        timestamps: {
          capturedAt: loc.timestamps.capturedAt.toISOString(),
          expiresAt: loc.timestamps.expiresAt?.toISOString(),
          lastVerifiedAt: loc.timestamps.lastVerifiedAt?.toISOString(),
        },
        metadata: {
          source: loc.metadata.source,
          verificationMethod: loc.metadata.verificationMethod,
          traId: loc.metadata.traId,
          projectId: loc.metadata.projectId,
          sessionId: loc.metadata.sessionId,
          isOffline: loc.metadata.isOffline,
        },
      })),
      count: cachedLocations.length,
    });
  } catch (error) {
    console.error("Error fetching cached locations:", error);
    return Errors.serverError(new Error("Failed to fetch cached locations"));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireOrgAuth(request);
    if (!auth) {
      return Errors.unauthorized();
    }

    // Get location ID from request body
    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return Errors.validation(new Error("Location ID is required"));
    }

    // Clear location cache
    locationService.clearCache();

    // Create audit log entry
    await writeAuditLog(auth.orgId, locationId, auth.uid, "delete", {
      resourceType: "location",
      reason: "User requested deletion",
    });

    return NextResponse.json({
      success: true,
      message: "Location cache cleared",
    });
  } catch (error) {
    console.error("Error clearing location cache:", error);
    return Errors.serverError(new Error("Failed to clear location cache"));
  }
}
