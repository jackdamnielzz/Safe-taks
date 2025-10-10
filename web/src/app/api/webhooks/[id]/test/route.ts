/**
 * Test Webhook API
 *
 * POST /api/webhooks/[id]/test - Send test event to webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/webhooks/webhook-service";
import { TestWebhookSchema, WebhookEventType } from "@/lib/types/webhook";
import { requireAuth } from "@/lib/api/auth";

// POST /api/webhooks/[id]/test - Send test event to webhook
export const POST = requireAuth(
  async (request: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    
    try {
      // Check if user has permission to manage webhooks
      if (!["admin", "safety_manager"].includes(user.role || "")) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const webhook = await webhookService.getWebhook(id);
      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
      }

      // Check if webhook belongs to user's organization
      if (webhook.organizationId !== user.orgId) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
      }

      const body = await request.json();

      // Validate request body
      const validationResult = TestWebhookSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.issues,
          },
          { status: 400 }
        );
      }

      const { eventType } = validationResult.data;

      // Check if the webhook is configured to receive this event type
      if (!webhook.events.includes(eventType)) {
        return NextResponse.json(
          { error: `Webhook is not configured to receive ${eventType} events` },
          { status: 400 }
        );
      }

      // Create test payload
      const testPayload = {
        id: `test_${Date.now()}`,
        type: eventType,
        organizationId: user.orgId,
        timestamp: new Date(),
        data: {
          test: true,
          message: "This is a test webhook event",
          webhookId: webhook.id,
          webhookName: webhook.name,
        },
      };

      // Send test webhook
      const result = await webhookService.deliverWebhook(webhook, eventType, testPayload);

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Test webhook failed",
            details: result.errorMessage,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Test webhook sent successfully",
        deliveryId: result.responseBody,
      });
    } catch (error: any) {
      console.error("Test webhook error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
