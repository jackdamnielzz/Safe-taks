/**
 * Webhooks API - Management Endpoints
 *
 * GET /api/webhooks - List webhooks for organization
 * POST /api/webhooks - Create new webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/webhooks/webhook-service";
import { CreateWebhookSchema } from "@/lib/types/webhook";
import { authenticateRequest, requireAuth } from "@/lib/api/auth";

// GET /api/webhooks - List webhooks for organization
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const webhooks = await webhookService.getWebhooksForOrganization(user.orgId);

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    console.error("Get webhooks error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
});

// POST /api/webhooks - Create new webhook
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has permission to manage webhooks
    if (!["admin", "safety_manager"].includes(user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CreateWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const webhookData = validationResult.data;

    // Generate secure secret if not provided
    if (!webhookData.secret) {
      webhookData.secret = generateSecureSecret();
    }

    // Create webhook
    const webhook = await webhookService.createWebhook({
      ...webhookData,
      organizationId: user.orgId,
    });

    return NextResponse.json(
      {
        success: true,
        data: webhook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
});

/**
 * Generate a cryptographically secure secret for webhook verification
 */
function generateSecureSecret(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}
