import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { WebPushClient, BrowserPushManager } from "./web-push-client";
import {
  NotificationSubscription,
  NotificationPreferences,
  NotificationPayload,
  PushSubscriptionData,
  NotificationHistory,
  BatchNotificationRequest,
  NotificationType,
  NotificationPriority,
  UpdateNotificationPreferences,
  CreateNotificationPayload,
  NotificationCenterItem,
  NotificationFilters,
  NotificationPagination,
  NotificationHistoryResponse,
} from "../types/notification";

/**
 * Main push notification service for SafeWork Pro
 * Handles subscription management, preferences, notification sending, and history tracking
 */
export class PushNotificationService {
  private webPushClient: WebPushClient;
  private browserManager: BrowserPushManager;
  private vapidPublicKey: string;

  constructor(vapidKeys: { publicKey: string; privateKey: string }) {
    this.vapidPublicKey = vapidKeys.publicKey;
    this.webPushClient = new WebPushClient(vapidKeys);
    this.browserManager = new BrowserPushManager();
  }

  /**
   * Initialize user for push notifications
   * Sets up subscription and default preferences
   */
  async initializeUser(
    userId: string,
    organizationId: string,
    preferences?: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // Check if user already has a subscription
      const existingSubscription = await this.getUserSubscription(userId, organizationId);
      if (existingSubscription) {
        return {
          success: true,
          subscriptionId: existingSubscription.id,
        };
      }

      // Subscribe for push notifications
      const subscriptionData = await this.browserManager.subscribe(this.vapidPublicKey);
      if (!subscriptionData) {
        return {
          success: false,
          error: "Failed to subscribe for push notifications",
        };
      }

      // Create subscription document
      const subscriptionId = await this.createSubscription(
        userId,
        organizationId,
        subscriptionData,
        preferences
      );

      return {
        success: true,
        subscriptionId,
      };
    } catch (error) {
      console.error("Failed to initialize user for push notifications:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    organizationId: string,
    preferences: UpdateNotificationPreferences
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId, organizationId);
      if (!subscription) {
        return {
          success: false,
          error: "No active subscription found",
        };
      }

      const updatedPreferences: NotificationPreferences = {
        ...subscription.preferences,
        ...preferences,
      };

      await updateDoc(doc(db, "notificationSubscriptions", subscription.id!), {
        preferences: updatedPreferences,
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: string,
    organizationId: string,
    payload: CreateNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId, organizationId);
      if (!subscription) {
        return {
          success: false,
          error: "No active subscription found for user",
        };
      }

      // Check if user has enabled notifications for this priority and type
      if (!this.shouldSendNotification(subscription.preferences, payload)) {
        return {
          success: true, // Not an error, just filtered out by preferences
        };
      }

      // Create full notification payload
      const fullPayload: NotificationPayload = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        organizationId,
        timestamp: Timestamp.now(),
        ...payload,
      };

      // Send notification
      const result = await this.webPushClient.sendNotification(
        subscription.subscription,
        fullPayload
      );

      if (result.success) {
        // Track notification history
        await this.trackNotification(fullPayload, subscription.id!, "SENT");
      } else {
        await this.trackNotification(fullPayload, subscription.id!, "FAILED", result.error);
      }

      return result;
    } catch (error) {
      console.error("Failed to send notification to user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send batch notifications to multiple users
   */
  async sendBatchNotifications(request: BatchNotificationRequest): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    try {
      // Get subscriptions for target users
      const subscriptions = await this.getSubscriptionsForBatch(request);

      if (subscriptions.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          errors: ["No active subscriptions found for target users"],
        };
      }

      // Create notification payload
      const payload: NotificationPayload = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: "", // Will be set for each user
        organizationId: request.organizationId,
        timestamp: request.scheduledFor || Timestamp.now(),
        type: request.type,
        priority: request.priority,
        title: request.title,
        body: request.body,
        data: request.data,
      };

      // Send notifications in batches
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      const batchSize = 100;
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);

        for (const subscription of batch) {
          // Check user preferences for this specific notification
          if (!this.shouldSendNotification(subscription.preferences, payload)) {
            continue;
          }

          // Send individual notification
          const individualPayload: NotificationPayload = {
            ...payload,
            userId: subscription.userId,
            organizationId: subscription.organizationId,
          };

          const result = await this.webPushClient.sendNotification(
            subscription.subscription,
            individualPayload
          );

          if (result.success) {
            results.sent++;
            await this.trackNotification(individualPayload, subscription.id!, "SENT");
          } else {
            results.failed++;
            if (result.error) {
              results.errors.push(result.error);
            }
            await this.trackNotification(
              individualPayload,
              subscription.id!,
              "FAILED",
              result.error
            );
          }
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < subscriptions.length) {
          await this.delay(1000);
        }
      }

      return {
        success: results.failed === 0,
        ...results,
      };
    } catch (error) {
      console.error("Failed to send batch notifications:", error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      };
    }
  }

  /**
   * Get user's notification history with pagination and filters
   */
  async getNotificationHistory(
    userId: string,
    organizationId: string,
    filters?: NotificationFilters,
    pagination?: NotificationPagination
  ): Promise<NotificationHistoryResponse> {
    try {
      let q = query(
        collection(db, "notificationHistory"),
        where("userId", "==", userId),
        where("organizationId", "==", organizationId),
        orderBy("sentAt", "desc")
      );

      // Apply filters
      if (filters?.types?.length) {
        q = query(q, where("payload.type", "in", filters.types));
      }

      if (filters?.priorities?.length) {
        q = query(q, where("payload.priority", "in", filters.priorities));
      }

      if (filters?.dateRange) {
        q = query(
          q,
          where("sentAt", ">=", Timestamp.fromDate(filters.dateRange.start)),
          where("sentAt", "<=", Timestamp.fromDate(filters.dateRange.end))
        );
      }

      // Apply pagination
      if (pagination) {
        q = query(q, limit(pagination.limit));
      }

      const snapshot = await getDocs(q);
      const notifications: NotificationCenterItem[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as NotificationHistory;
        notifications.push({
          id: doc.id,
          type: data.payload.type,
          priority: data.payload.priority,
          title: data.payload.title,
          body: data.payload.body,
          timestamp: data.sentAt,
          isRead: data.status === "CLICKED" || data.status === "DISMISSED",
          isArchived: false, // Could be added as a separate field
          actions: data.payload.actions,
        });
      });

      // Get unread count
      const unreadQuery = query(
        collection(db, "notificationHistory"),
        where("userId", "==", userId),
        where("organizationId", "==", organizationId),
        where("status", "in", ["SENT", "DELIVERED"])
      );
      const unreadSnapshot = await getDocs(unreadQuery);
      const unreadCount = unreadSnapshot.size;

      return {
        notifications,
        pagination: pagination || {
          page: 1,
          limit: 20,
          total: notifications.length,
          hasNext: false,
          hasPrev: false,
        },
        filters: filters || {},
        unreadCount,
      };
    } catch (error) {
      console.error("Failed to get notification history:", error);
      return {
        notifications: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {},
        unreadCount: 0,
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notificationRef = doc(db, "notificationHistory", notificationId);
      const notification = await getDoc(notificationRef);

      if (!notification.exists()) {
        return {
          success: false,
          error: "Notification not found",
        };
      }

      const data = notification.data() as NotificationHistory;
      if (data.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      await updateDoc(notificationRef, {
        status: "CLICKED",
        clickedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(
    userId: string,
    organizationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId, organizationId);
      if (!subscription) {
        return { success: true }; // Already unsubscribed
      }

      // Unsubscribe from browser
      await this.browserManager.unsubscribe();

      // Remove subscription from database
      await deleteDoc(doc(db, "notificationSubscriptions", subscription.id!));

      return { success: true };
    } catch (error) {
      console.error("Failed to unsubscribe user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create default notification preferences
   */
  private createDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      priorities: {
        LOW: true,
        MEDIUM: true,
        HIGH: true,
        CRITICAL: true,
      },
      types: {
        LMRA_STOP_WORK: true,
        LMRA_COMPLETED: false,
        TRA_APPROVED: true,
        TRA_REJECTED: true,
        TRA_OVERDUE: true,
        SAFETY_INCIDENT: true,
        EQUIPMENT_ISSUE: true,
        WEATHER_ALERT: true,
        SYSTEM_ALERT: true,
      },
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
      channels: {
        push: true,
        email: true,
        sms: false,
      },
    };
  }

  /**
   * Create subscription document in Firestore
   */
  private async createSubscription(
    userId: string,
    organizationId: string,
    subscriptionData: PushSubscriptionData,
    preferences?: Partial<NotificationPreferences>
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      userId,
      organizationId,
      subscription: subscriptionData,
      preferences: {
        ...this.createDefaultPreferences(),
        ...preferences,
      },
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: this.getBrowserInfo(),
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, "notificationSubscriptions", subscriptionId), subscription);
    return subscriptionId;
  }

  /**
   * Get user subscription from Firestore
   */
  private async getUserSubscription(
    userId: string,
    organizationId: string
  ): Promise<NotificationSubscription | null> {
    try {
      const q = query(
        collection(db, "notificationSubscriptions"),
        where("userId", "==", userId),
        where("organizationId", "==", organizationId),
        where("isActive", "==", true)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as NotificationSubscription;
    } catch (error) {
      console.error("Failed to get user subscription:", error);
      return null;
    }
  }

  /**
   * Get subscriptions for batch notification
   */
  private async getSubscriptionsForBatch(
    request: BatchNotificationRequest
  ): Promise<NotificationSubscription[]> {
    let q = query(
      collection(db, "notificationSubscriptions"),
      where("organizationId", "==", request.organizationId),
      where("isActive", "==", true)
    );

    if (request.userIds?.length) {
      q = query(q, where("userId", "in", request.userIds));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as NotificationSubscription);
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    preferences: NotificationPreferences,
    payload: CreateNotificationPayload
  ): boolean {
    // Check if notifications are enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check priority preference
    if (!preferences.priorities[payload.priority]) {
      return false;
    }

    // Check notification type preference
    if (!preferences.types[payload.type]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const startTime = preferences.quietHours.start;
      const endTime = preferences.quietHours.end;

      if (this.isTimeInRange(currentTime, startTime, endTime)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Track notification in history
   */
  private async trackNotification(
    payload: NotificationPayload,
    subscriptionId: string,
    status: "SENT" | "DELIVERED" | "FAILED",
    errorMessage?: string
  ): Promise<void> {
    try {
      const history: Omit<NotificationHistory, "id"> = {
        userId: payload.userId,
        organizationId: payload.organizationId,
        subscriptionId,
        payload,
        status,
        sentAt: Timestamp.now(),
        ...(status === "DELIVERED" && { deliveredAt: Timestamp.now() }),
        ...(errorMessage && { errorMessage }),
      };

      await setDoc(doc(db, "notificationHistory"), history);
    } catch (error) {
      console.error("Failed to track notification:", error);
    }
  }

  /**
   * Check if current time is in quiet hours range
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Handle overnight quiet hours
      return current >= start || current <= end;
    }
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get browser information from user agent
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get VAPID public key for frontend use
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Check if browser supports push notifications
   */
  static isSupported(): boolean {
    return BrowserPushManager.isSupported();
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return BrowserPushManager.getPermissionStatus();
  }
}

/**
 * Factory function to create push notification service
 */
export function createPushNotificationService(vapidKeys: {
  publicKey: string;
  privateKey: string;
}) {
  return new PushNotificationService(vapidKeys);
}

/**
 * Utility functions for notification management
 */
export class NotificationUtils {
  /**
   * Create notification payload for LMRA stop work alert
   */
  static createLMRAStopWorkNotification(
    lmraId: string,
    projectName: string,
    reason: string,
    location?: string
  ): Omit<CreateNotificationPayload, "userId" | "organizationId"> {
    return {
      type: "LMRA_STOP_WORK",
      priority: "CRITICAL",
      title: "🚨 STOP WORK - LMRA Alert",
      body: `Stop werk order uitgegeven voor project "${projectName}". Reden: ${reason}${location ? ` Locatie: ${location}` : ""}`,
      data: {
        lmraId,
        projectName,
        reason,
        location,
        actionUrl: `/lmra/${lmraId}`,
      },
      actions: [
        {
          action: "view",
          title: "Bekijken",
        },
        {
          action: "acknowledge",
          title: "Bevestigen",
        },
      ],
      requireInteraction: true,
      tag: `lmra-stop-work-${lmraId}`,
    };
  }

  /**
   * Create notification payload for TRA approval
   */
  static createTRAApprovalNotification(
    traId: string,
    title: string,
    approverName: string,
    status: "approved" | "rejected"
  ): Omit<CreateNotificationPayload, "userId" | "organizationId"> {
    const isApproved = status === "approved";
    return {
      type: isApproved ? "TRA_APPROVED" : "TRA_REJECTED",
      priority: isApproved ? "MEDIUM" : "HIGH",
      title: `TRA ${isApproved ? "Goedgekeurd" : "Afgekeurd"}`,
      body: `"${title}" is ${isApproved ? "goedgekeurd" : "afgekeurd"} door ${approverName}`,
      data: {
        traId,
        title,
        approverName,
        status,
        actionUrl: `/tra/${traId}`,
      },
      actions: [
        {
          action: "view",
          title: "Bekijken",
        },
      ],
      tag: `tra-${status}-${traId}`,
    };
  }

  /**
   * Create notification payload for safety incident
   */
  static createSafetyIncidentNotification(
    incidentId: string,
    title: string,
    severity: "low" | "medium" | "high" | "critical",
    location: string
  ): Omit<CreateNotificationPayload, "userId" | "organizationId"> {
    const priority = severity === "critical" ? "CRITICAL" : severity === "high" ? "HIGH" : "MEDIUM";
    return {
      type: "SAFETY_INCIDENT",
      priority,
      title: `🚨 Veiligheidsincident: ${title}`,
      body: `Nieuw veiligheidsincident gemeld op locatie ${location}. Urgentie: ${severity}`,
      data: {
        incidentId,
        title,
        severity,
        location,
        actionUrl: `/incidents/${incidentId}`,
      },
      actions: [
        {
          action: "view",
          title: "Bekijken",
        },
        {
          action: "respond",
          title: "Reageren",
        },
      ],
      requireInteraction: priority === "CRITICAL",
      tag: `safety-incident-${incidentId}`,
    };
  }

  /**
   * Create notification payload for equipment issue
   */
  static createEquipmentIssueNotification(
    equipmentId: string,
    equipmentName: string,
    issue: string,
    priority: NotificationPriority = "MEDIUM"
  ): Omit<CreateNotificationPayload, "userId" | "organizationId"> {
    return {
      type: "EQUIPMENT_ISSUE",
      priority,
      title: `⚠️ Equipment probleem: ${equipmentName}`,
      body: `Er is een probleem gemeld met ${equipmentName}: ${issue}`,
      data: {
        equipmentId,
        equipmentName,
        issue,
        actionUrl: `/equipment/${equipmentId}`,
      },
      actions: [
        {
          action: "view",
          title: "Bekijken",
        },
      ],
      tag: `equipment-issue-${equipmentId}`,
    };
  }

  /**
   * Validate notification payload
   */
  static validateNotificationPayload(payload: CreateNotificationPayload): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!payload.title?.trim()) {
      errors.push("Title is required");
    }

    if (!payload.body?.trim()) {
      errors.push("Body is required");
    }

    if (!payload.type) {
      errors.push("Type is required");
    }

    if (!payload.priority) {
      errors.push("Priority is required");
    }

    const validPriorities: NotificationPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (payload.priority && !validPriorities.includes(payload.priority)) {
      errors.push("Invalid priority level");
    }

    const validTypes: NotificationType[] = [
      "LMRA_STOP_WORK",
      "LMRA_COMPLETED",
      "TRA_APPROVED",
      "TRA_REJECTED",
      "TRA_OVERDUE",
      "SAFETY_INCIDENT",
      "EQUIPMENT_ISSUE",
      "WEATHER_ALERT",
      "SYSTEM_ALERT",
    ];
    if (payload.type && !validTypes.includes(payload.type)) {
      errors.push("Invalid notification type");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
