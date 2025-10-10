/**
 * Webhook Management API - Individual Webhook Operations
 *
 * GET /api/webhooks/[id] - Get webhook by ID
 * PATCH /api/webhooks/[id] - Update webhook
 * DELETE /api/webhooks/[id] - Delete webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/webhooks/webhook-service";
import { UpdateWebhookSchema } from "@/lib/types/webhook";
import { requireAuth } from "@/lib/api/auth";

// GET /api/webhooks/[id] - Get webhook by ID
export const GET = requireAuth(
  async (request: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    
    try {
      const webhook = await webhookService.getWebhook(id);

      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
      }

      // Check if webhook belongs to user's organization
      if (webhook.organizationId !== user.orgId) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: webhook,
      });
    } catch (error: any) {
      console.error("Get webhook error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/webhooks/[id] - Update webhook
export const PATCH = requireAuth(
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
      const validationResult = UpdateWebhookSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.issues,
          },
          { status: 400 }
        );
      }

      const updates = validationResult.data;

      // Update webhook
      const updatedWebhook = await webhookService.updateWebhook(id, updates);

      if (!updatedWebhook) {
        return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updatedWebhook,
      });
    } catch (error: any) {
      console.error("Update webhook error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/webhooks/[id] - Delete webhook
export const DELETE = requireAuth(
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

      const deleted = await webhookService.deleteWebhook(id);

      if (!deleted) {
        return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Webhook deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete webhook error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
