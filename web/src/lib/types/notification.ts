import { Timestamp } from "firebase/firestore";

// Notification priority levels
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Notification types for different safety events
export type NotificationType =
  | "LMRA_STOP_WORK"
  | "LMRA_COMPLETED"
  | "TRA_APPROVED"
  | "TRA_REJECTED"
  | "TRA_OVERDUE"
  | "SAFETY_INCIDENT"
  | "EQUIPMENT_ISSUE"
  | "WEATHER_ALERT"
  | "SYSTEM_ALERT";

// Push subscription data from browser
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// User notification preferences
export interface NotificationPreferences {
  enabled: boolean;
  priorities: {
    LOW: boolean;
    MEDIUM: boolean;
    HIGH: boolean;
    CRITICAL: boolean;
  };
  types: {
    LMRA_STOP_WORK: boolean;
    LMRA_COMPLETED: boolean;
    TRA_APPROVED: boolean;
    TRA_REJECTED: boolean;
    TRA_OVERDUE: boolean;
    SAFETY_INCIDENT: boolean;
    EQUIPMENT_ISSUE: boolean;
    WEATHER_ALERT: boolean;
    SYSTEM_ALERT: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

// Database notification subscription document
export interface NotificationSubscription {
  id?: string;
  userId: string;
  organizationId: string;
  subscription: PushSubscriptionData;
  preferences: NotificationPreferences;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// Notification payload for sending
export interface NotificationPayload {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
  timestamp: Timestamp;
}

// Notification action buttons
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification history for tracking and analytics
export interface NotificationHistory {
  id?: string;
  userId: string;
  organizationId: string;
  subscriptionId: string;
  payload: NotificationPayload;
  status: "SENT" | "DELIVERED" | "CLICKED" | "DISMISSED" | "FAILED";
  errorMessage?: string;
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  clickedAt?: Timestamp;
  dismissedAt?: Timestamp;
  clickedAction?: string;
}

// Batch notification request
export interface BatchNotificationRequest {
  organizationId: string;
  userIds?: string[];
  projectId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor?: Timestamp;
}

// VAPID key pair for push notifications
export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

// Notification statistics for analytics
export interface NotificationStats {
  organizationId: string;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalFailed: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
  byStatus: Record<string, number>;
  averageDeliveryTime: number; // in milliseconds
}

// Notification template for recurring alerts
export interface NotificationTemplate {
  id?: string;
  organizationId: string;
  name: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Real-time notification for immediate delivery
export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  targetUsers?: string[];
  targetProjects?: string[];
  organizationId: string;
  timestamp: Timestamp;
}

// Notification validation schemas
export interface NotificationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Browser notification permission status
export type NotificationPermission = "default" | "granted" | "denied";

// Service worker notification event data
export interface NotificationEventData {
  notificationId: string;
  action?: string;
  userId: string;
  organizationId: string;
  timestamp: Timestamp;
}

// Notification center display data
export interface NotificationCenterItem {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  timestamp: Timestamp;
  isRead: boolean;
  isArchived: boolean;
  actions?: NotificationAction[];
}

// Notification filter options for UI
export interface NotificationFilters {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  status?: ("read" | "unread" | "archived")[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Pagination for notification history
export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Complete notification response with pagination
export interface NotificationHistoryResponse {
  notifications: NotificationCenterItem[];
  pagination: NotificationPagination;
  filters: NotificationFilters;
  unreadCount: number;
}

// Push notification service configuration
export interface PushNotificationConfig {
  vapidKeys: VapidKeys;
  firebaseConfig?: {
    projectId: string;
    messagingSenderId: string;
  };
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  rateLimit: {
    perMinute: number;
    perHour: number;
  };
}

// Error types for notification system
export interface NotificationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
  retryable: boolean;
}

// Notification metrics for monitoring
export interface NotificationMetrics {
  timestamp: Timestamp;
  organizationId: string;
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
  averageDeliveryTime: number;
}

// Export utility type for creating notification payloads
export type CreateNotificationPayload = Omit<NotificationPayload, "id" | "timestamp">;

// Export utility type for updating preferences
export type UpdateNotificationPreferences = Partial<NotificationPreferences>;

// Export utility type for notification subscription updates
export type UpdateNotificationSubscription = Partial<
  Pick<NotificationSubscription, "preferences" | "deviceInfo" | "isActive">
>;
