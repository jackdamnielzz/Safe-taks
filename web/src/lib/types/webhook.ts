/**
 * Webhook System Types
 *
 * Defines the data models for webhook integrations including
 * webhook configurations, delivery tracking, and event routing.
 */

import { z } from "zod";

// Webhook event types that can be triggered
export const WebhookEventType = {
  // TRA Events
  TRA_CREATED: "tra.created",
  TRA_UPDATED: "tra.updated",
  TRA_SUBMITTED: "tra.submitted",
  TRA_APPROVED: "tra.approved",
  TRA_REJECTED: "tra.rejected",
  TRA_DELETED: "tra.deleted",

  // LMRA Events
  LMRA_CREATED: "lmra.created",
  LMRA_UPDATED: "lmra.updated",
  LMRA_COMPLETED: "lmra.completed",
  LMRA_STOP_WORK: "lmra.stop_work",

  // Organization Events
  USER_INVITED: "user.invited",
  USER_JOINED: "user.joined",
  USER_REMOVED: "user.removed",

  // Project Events
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_DELETED: "project.deleted",

  // Report Events
  REPORT_GENERATED: "report.generated",
  REPORT_DOWNLOADED: "report.downloaded",

  // Compliance Events
  COMPLIANCE_VIOLATION: "compliance.violation",
  COMPLIANCE_RESOLVED: "compliance.resolved",
} as const;

export type WebhookEventType = (typeof WebhookEventType)[keyof typeof WebhookEventType];

// Webhook configuration schema
export const WebhookConfigSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1, "Webhook name is required"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().min(16, "Secret must be at least 16 characters"),
  events: z.array(z.nativeEnum(WebhookEventType)),
  active: z.boolean().default(true),
  retryCount: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(1000).default(5000), // milliseconds
  timeout: z.number().min(1000).max(30000).default(10000), // milliseconds
  headers: z.record(z.string(), z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastDeliveryAt: z.date().optional(),
  failureCount: z.number().default(0),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Webhook delivery attempt schema
export const WebhookDeliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  organizationId: z.string(),
  eventType: z.nativeEnum(WebhookEventType),
  eventId: z.string(), // ID of the triggering event (TRA ID, LMRA ID, etc.)
  payload: z.record(z.string(), z.any()),
  status: z.enum(["pending", "success", "failed", "retrying"]),
  statusCode: z.number().optional(),
  responseBody: z.string().optional(),
  errorMessage: z.string().optional(),
  attemptNumber: z.number().min(1),
  maxAttempts: z.number().min(1),
  nextRetryAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  createdAt: z.date(),
});

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

// Webhook event payload schemas
export const WebhookEventPayloadSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WebhookEventType),
  organizationId: z.string(),
  timestamp: z.date(),
  data: z.record(z.string(), z.any()),
});

export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>;

// Validation schemas for API requests
export const CreateWebhookSchema = WebhookConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastDeliveryAt: true,
  failureCount: true,
});

export const UpdateWebhookSchema = CreateWebhookSchema.partial().extend({
  id: z.string(),
});

export const TestWebhookSchema = z.object({
  webhookId: z.string(),
  eventType: z.nativeEnum(WebhookEventType).optional().default(WebhookEventType.TRA_CREATED),
});

// Utility types for webhook management
export interface WebhookDeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  lastDeliveryAt?: Date;
  failureRate: number;
}

export interface WebhookHealth {
  webhookId: string;
  status: "healthy" | "degraded" | "failing";
  lastSuccessAt?: Date;
  consecutiveFailures: number;
  totalFailures: number;
  averageResponseTime: number;
}

// Event routing configuration
export interface EventRouter {
  eventType: WebhookEventType;
  filter?: (payload: WebhookEventPayload) => boolean;
  transform?: (payload: WebhookEventPayload) => Record<string, any>;
}

// Webhook delivery result
export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  duration: number;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 5000,
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 2,
  jitter: true,
};
