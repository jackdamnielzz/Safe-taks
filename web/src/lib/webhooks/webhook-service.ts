/**
 * Webhook Service
 *
 * Core webhook functionality including delivery, retry logic,
 * authentication, and event routing for external integrations.
 */

import { createHmac } from "crypto";
import {
  WebhookConfig,
  WebhookDelivery,
  WebhookEventPayload,
  WebhookDeliveryResult,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  WebhookEventType,
} from "@/lib/types/webhook";

// Simple in-memory storage for development
// In production, this would use Firestore or Redis
class WebhookStorage {
  private webhooks = new Map<string, WebhookConfig>();
  private deliveries = new Map<string, WebhookDelivery>();

  // Webhook management
  async saveWebhook(webhook: WebhookConfig): Promise<void> {
    this.webhooks.set(webhook.id, webhook);
  }

  async getWebhook(id: string): Promise<WebhookConfig | null> {
    return this.webhooks.get(id) || null;
  }

  async getWebhooksByOrganization(organizationId: string): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.organizationId === organizationId && webhook.active
    );
  }

  async deleteWebhook(id: string): Promise<void> {
    this.webhooks.delete(id);
  }

  // Delivery tracking
  async saveDelivery(delivery: WebhookDelivery): Promise<void> {
    this.deliveries.set(delivery.id, delivery);
  }

  async getDelivery(id: string): Promise<WebhookDelivery | null> {
    return this.deliveries.get(id) || null;
  }

  async getDeliveriesByWebhook(webhookId: string): Promise<WebhookDelivery[]> {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.webhookId === webhookId
    );
  }

  async getFailedDeliveries(): Promise<WebhookDelivery[]> {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.status === "failed" || delivery.status === "retrying"
    );
  }
}

// Global storage instance
const webhookStorage = new WebhookStorage();

/**
 * Webhook Service Class
 */
export class WebhookService {
  private storage: WebhookStorage;

  constructor(storage?: WebhookStorage) {
    this.storage = storage || webhookStorage;
  }

  /**
   * Create a new webhook configuration
   */
  async createWebhook(
    config: Omit<WebhookConfig, "id" | "createdAt" | "updatedAt" | "failureCount">
  ): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      failureCount: 0,
      ...config,
    };

    await this.storage.saveWebhook(webhook);
    return webhook;
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(id: string): Promise<WebhookConfig | null> {
    return this.storage.getWebhook(id);
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | null> {
    const webhook = await this.storage.getWebhook(id);
    if (!webhook) return null;

    const updatedWebhook: WebhookConfig = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    };

    await this.storage.saveWebhook(updatedWebhook);
    return updatedWebhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    const webhook = await this.storage.getWebhook(id);
    if (!webhook) return false;

    await this.storage.deleteWebhook(id);
    return true;
  }

  /**
   * Get all webhooks for an organization
   */
  async getWebhooksForOrganization(organizationId: string): Promise<WebhookConfig[]> {
    return this.storage.getWebhooksByOrganization(organizationId);
  }

  /**
   * Deliver webhook with retry logic
   */
  async deliverWebhook(
    webhook: WebhookConfig,
    eventType: WebhookEventType,
    payload: Record<string, any>
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      organizationId: webhook.organizationId,
      eventType,
      eventId: payload.id || deliveryId,
      payload,
      status: "pending",
      attemptNumber: 1,
      maxAttempts: webhook.retryCount + 1,
      createdAt: new Date(),
    };

    await this.storage.saveDelivery(delivery);

    const result = await this.executeDelivery(delivery, webhook);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update delivery status
    delivery.status = result.success ? "success" : "failed";
    delivery.statusCode = result.statusCode;
    delivery.responseBody = result.responseBody;
    delivery.errorMessage = result.errorMessage;
    delivery.deliveredAt = result.success ? new Date() : undefined;

    await this.storage.saveDelivery(delivery);

    // Update webhook failure count
    if (!result.success) {
      webhook.failureCount += 1;
      webhook.lastDeliveryAt = new Date();
      await this.storage.saveWebhook(webhook);
    }

    return { ...result, duration };
  }

  /**
   * Execute webhook delivery with retry logic
   */
  private async executeDelivery(
    delivery: WebhookDelivery,
    webhook: WebhookConfig
  ): Promise<WebhookDeliveryResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= delivery.maxAttempts; attempt++) {
      try {
        delivery.attemptNumber = attempt;
        delivery.status = attempt < delivery.maxAttempts ? "retrying" : "pending";

        if (attempt > 1) {
          await this.storage.saveDelivery(delivery);

          // Calculate delay with exponential backoff
          const delay = this.calculateRetryDelay(attempt - 1, webhook.retryDelay);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await this.sendWebhookRequest(delivery, webhook);

        if (result.success) {
          return result;
        }

        lastError = result.errorMessage;

        // Don't retry on certain status codes
        if (result.statusCode && [400, 401, 403, 404, 410].includes(result.statusCode)) {
          break;
        }
      } catch (error: any) {
        lastError = error.message;

        // Don't retry on network errors after max attempts
        if (attempt === delivery.maxAttempts) {
          break;
        }
      }
    }

    return {
      success: false,
      errorMessage: lastError || "Max retry attempts exceeded",
      duration: 0,
    };
  }

  /**
   * Send HTTP request to webhook endpoint
   */
  private async sendWebhookRequest(
    delivery: WebhookDelivery,
    webhook: WebhookConfig
  ): Promise<WebhookDeliveryResult> {
    try {
      const signature = this.generateSignature(delivery.payload, webhook.secret);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "SafeWork-Pro-Webhook/1.0",
        "X-SafeWork-Event": delivery.eventType,
        "X-SafeWork-Delivery": delivery.id,
        "X-SafeWork-Signature": signature,
        ...webhook.headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(delivery.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        responseBody,
        duration: 0,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          success: false,
          errorMessage: `Request timeout after ${webhook.timeout}ms`,
          duration: 0,
        };
      }

      return {
        success: false,
        errorMessage: error.message,
        duration: 0,
      };
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: Record<string, any>, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return createHmac("sha256", secret).update(payloadString).digest("hex");
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
  }

  /**
   * Process webhook event for all matching webhooks
   */
  async processWebhookEvent(
    eventType: WebhookEventType,
    payload: Record<string, any>,
    organizationId: string
  ): Promise<void> {
    const webhooks = await this.storage.getWebhooksByOrganization(organizationId);

    const matchingWebhooks = webhooks.filter(
      (webhook) => webhook.events.includes(eventType) && webhook.active
    );

    const eventPayload: WebhookEventPayload = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      organizationId,
      timestamp: new Date(),
      data: payload,
    };

    // Deliver to all matching webhooks in parallel
    const deliveryPromises = matchingWebhooks.map((webhook) =>
      this.deliverWebhook(webhook, eventType, eventPayload)
    );

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Get delivery statistics for a webhook
   */
  async getWebhookStats(webhookId: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
  }> {
    const deliveries = await this.storage.getDeliveriesByWebhook(webhookId);

    const successfulDeliveries = deliveries.filter((d) => d.status === "success");
    const totalResponseTime = successfulDeliveries.reduce(
      (sum, d) => sum + (d.deliveredAt?.getTime() || 0),
      0
    );
    const averageResponseTime =
      successfulDeliveries.length > 0 ? totalResponseTime / successfulDeliveries.length : 0;

    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: successfulDeliveries.length,
      failedDeliveries: deliveries.filter((d) => d.status === "failed").length,
      averageResponseTime,
    };
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    const failedDeliveries = await this.storage.getFailedDeliveries();

    for (const delivery of failedDeliveries) {
      if (delivery.attemptNumber < delivery.maxAttempts) {
        const webhook = await this.storage.getWebhook(delivery.webhookId);
        if (webhook && webhook.active) {
          await this.executeDelivery(delivery, webhook);
        }
      }
    }
  }
}

// Global webhook service instance
export const webhookService = new WebhookService();

/**
 * Utility function to trigger webhook events
 */
export async function triggerWebhookEvent(
  eventType: WebhookEventType,
  data: Record<string, any>,
  organizationId: string
): Promise<void> {
  await webhookService.processWebhookEvent(eventType, data, organizationId);
}
