/**
 * Webhook Events API
 *
 * POST /api/webhooks/events - Trigger webhook events manually
 */

import { NextRequest, NextResponse } from "next/server";
import { triggerWebhookEvent } from "@/lib/webhooks/webhook-service";
import { WebhookEventType } from "@/lib/types/webhook";
import { requireAuth } from "@/lib/api/auth";

// POST /api/webhooks/events - Trigger webhook events manually
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has permission to trigger webhook events
    if (!["admin", "safety_manager"].includes(user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { eventType, data, organizationId } = body;

    // Validate required fields
    if (!eventType) {
      return NextResponse.json({ error: "Missing required field: eventType" }, { status: 400 });
    }

    // Validate event type
    if (!Object.values(WebhookEventType).includes(eventType)) {
      return NextResponse.json({ error: `Invalid event type: ${eventType}` }, { status: 400 });
    }

    // Use user's organization if not specified
    const targetOrganizationId = organizationId || user.orgId;

    // Validate organization access
    if (targetOrganizationId !== user.orgId && !["admin"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Cannot trigger events for other organizations" },
        { status: 403 }
      );
    }

    // Trigger webhook event
    await triggerWebhookEvent(eventType, data || {}, targetOrganizationId);

    return NextResponse.json({
      success: true,
      message: `Webhook event ${eventType} triggered successfully`,
    });
  } catch (error: any) {
    console.error("Trigger webhook event error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
});
