/**
 * GDPR Data Deletion API
 *
 * Implements GDPR Article 17 - Right to Erasure (Right to be Forgotten)
 * Allows users to request deletion of their personal data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/server-helpers";
import { GDPRComplianceService } from "@/lib/gdpr/gdpr-compliance";

/**
 * Request data deletion
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireOrgAuth();
    const { uid: userId, orgId } = auth;

    const body = await request.json();
    const { reason } = body;

    // Create deletion request
    const deletionRequest = await GDPRComplianceService.requestDataDeletion({
      userId,
      organizationId: orgId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Data deletion request submitted successfully",
      deletionRequest: {
        scheduledDate: deletionRequest.scheduledDeletionDate,
        status: deletionRequest.status,
        gracePeriod: "30 days",
      },
    });
  } catch (error) {
    console.error("GDPR deletion request error:", error);
    return NextResponse.json(
      { error: "Failed to request data deletion", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Execute data deletion (admin only, after grace period)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user (should be admin)
    const auth = await requireOrgAuth();
    const { uid: userId, orgId } = auth;

    // Execute deletion
    const result = await GDPRComplianceService.executeDataDeletion(orgId, userId);

    return NextResponse.json({
      success: result.success,
      message: "Data deletion completed",
      result: {
        deletedCategories: result.deletedCategories,
        retainedCategories: result.retainedCategories,
        retentionReason: result.retentionReason,
        confirmationId: result.confirmationId,
      },
    });
  } catch (error) {
    console.error("GDPR deletion execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute data deletion", details: (error as Error).message },
      { status: 500 }
    );
  }
}
