import webpush from "web-push";
import {
  PushSubscriptionData,
  NotificationPayload,
  VapidKeys,
  NotificationError,
  PushNotificationConfig,
} from "../types/notification";

/**
 * Web Push Client for managing push notifications
 * Handles VAPID key generation, subscription management, and notification sending
 */
export class WebPushClient {
  private vapidKeys: VapidKeys;
  private config: PushNotificationConfig;

  constructor(vapidKeys: VapidKeys, config?: Partial<PushNotificationConfig>) {
    this.vapidKeys = vapidKeys;
    this.config = {
      vapidKeys,
      retryAttempts: 3,
      retryDelay: 1000,
      batchSize: 100,
      rateLimit: {
        perMinute: 1000,
        perHour: 10000,
      },
      ...config,
    };

    // Configure web-push library
    webpush.setVapidDetails(
      "mailto:admin@maasiso.nl",
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  /**
   * Generate a new VAPID key pair
   * Used for initial setup or key rotation
   */
  static generateVapidKeys(): VapidKeys {
    const vapidKeys = webpush.generateVAPIDKeys();
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
    };
  }

  /**
   * Convert VAPID key to Uint8Array for browser API
   */
  static urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert Uint8Array to base64url string for storage
   */
  static uint8ArrayToBase64Url(array: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...array));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  /**
   * Subscribe user for push notifications
   */
  async subscribeForNotifications(
    subscription: PushSubscriptionData,
    userId: string,
    organizationId: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // Validate subscription data
      if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        throw new Error("Invalid subscription data");
      }

      // Here you would typically save the subscription to Firestore
      // For now, we'll return success
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        subscriptionId,
      };
    } catch (error) {
      console.error("Failed to subscribe for notifications:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeFromNotifications(
    subscriptionId: string,
    userId: string,
    organizationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Here you would typically remove the subscription from Firestore
      return { success: true };
    } catch (error) {
      console.error("Failed to unsubscribe from notifications:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send push notification to a single subscription
   */
  async sendNotification(
    subscription: PushSubscriptionData,
    payload: NotificationPayload,
    options?: {
      urgency?: "very-low" | "low" | "normal" | "high";
      topic?: string;
      ttl?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Prepare notification payload
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192x192.png",
        badge: payload.badge || "/badge-72x72.png",
        image: payload.image,
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        tag: payload.tag,
        renotify: payload.renotify || false,
        timestamp: payload.timestamp.toMillis(),
        priority: payload.priority,
        type: payload.type,
      });

      // Send notification with retry logic
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          await webpush.sendNotification(subscription, pushPayload, {
            urgency: options?.urgency || this.getUrgencyFromPriority(payload.priority),
            topic: options?.topic,
            TTL: options?.ttl || 86400, // 24 hours default
          });

          return { success: true };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error");

          // Don't retry on certain errors
          if (this.isNonRetryableError(lastError)) {
            break;
          }

          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * attempt);
          }
        }
      }

      return {
        success: false,
        error: lastError?.message || "Failed to send notification after retries",
      };
    } catch (error) {
      console.error("Failed to send push notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send notifications to multiple subscriptions (batch)
   */
  async sendBatchNotifications(
    subscriptions: PushSubscriptionData[],
    payload: NotificationPayload,
    options?: {
      urgency?: "very-low" | "low" | "normal" | "high";
      topic?: string;
      ttl?: number;
      batchSize?: number;
    }
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const batchSize = options?.batchSize || this.config.batchSize;
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process subscriptions in batches
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);

      const batchPromises = batch.map((subscription) =>
        this.sendNotification(subscription, payload, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            results.sent++;
          } else {
            results.failed++;
            if (result.value.error) {
              results.errors.push(result.value.error);
            }
          }
        } else {
          results.failed++;
          results.errors.push(result.reason?.message || "Unknown error");
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < subscriptions.length) {
        await this.delay(1000); // 1 second between batches
      }
    }

    return {
      success: results.failed === 0,
      ...results,
    };
  }

  /**
   * Validate push subscription data
   */
  validateSubscription(subscription: PushSubscriptionData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!subscription.endpoint) {
      errors.push("Missing endpoint");
    }

    if (!subscription.keys?.p256dh) {
      errors.push("Missing p256dh key");
    }

    if (!subscription.keys?.auth) {
      errors.push("Missing auth key");
    }

    // Validate key formats (basic validation)
    if (subscription.keys?.p256dh && !/^[A-Za-z0-9_-]+$/.test(subscription.keys.p256dh)) {
      errors.push("Invalid p256dh key format");
    }

    if (subscription.keys?.auth && !/^[A-Za-z0-9_-]+$/.test(subscription.keys.auth)) {
      errors.push("Invalid auth key format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get urgency level from notification priority
   */
  private getUrgencyFromPriority(priority: string): "very-low" | "low" | "normal" | "high" {
    switch (priority) {
      case "CRITICAL":
        return "high";
      case "HIGH":
        return "normal";
      case "MEDIUM":
        return "low";
      case "LOW":
      default:
        return "very-low";
    }
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableCodes = [
      400, // Bad Request
      401, // Unauthorized
      403, // Forbidden
      404, // Not Found
      410, // Gone (subscription no longer valid)
      413, // Payload Too Large
    ];

    const errorMessage = error.message.toLowerCase();
    return (
      nonRetryableCodes.some((code) => errorMessage.includes(code.toString())) ||
      errorMessage.includes("no such subscription") ||
      errorMessage.includes("invalid subscription") ||
      errorMessage.includes("subscription has expired")
    );
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get VAPID public key for frontend use
   */
  getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PushNotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Browser-side utilities for push notifications
 */
export class BrowserPushManager {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe for push notifications
   */
  async subscribe(vapidPublicKey: string): Promise<PushSubscriptionData | null> {
    try {
      // Check if service worker is ready
      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Subscribe for push notifications
      const subscription = await this.serviceWorkerRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: WebPushClient.urlBase64ToUint8Array(vapidPublicKey),
      });

      // Convert to our format
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: WebPushClient.uint8ArrayToBase64Url(
            new Uint8Array(subscription.getKey("p256dh")!)
          ),
          auth: WebPushClient.uint8ArrayToBase64Url(new Uint8Array(subscription.getKey("auth")!)),
        },
      };

      return subscriptionData;
    } catch (error) {
      console.error("Failed to subscribe for push notifications:", error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false;
      }

      const subscription = await this.serviceWorkerRegistration!.pushManager.getSubscription();
      if (subscription) {
        return await subscription.unsubscribe();
      }

      return true;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscriptionData | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
      }

      if (!this.serviceWorkerRegistration) {
        return null;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (!subscription) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: WebPushClient.uint8ArrayToBase64Url(
            new Uint8Array(subscription.getKey("p256dh")!)
          ),
          auth: WebPushClient.uint8ArrayToBase64Url(new Uint8Array(subscription.getKey("auth")!)),
        },
      };
    } catch (error) {
      console.error("Failed to get push subscription:", error);
      return null;
    }
  }

  /**
   * Register service worker for push notifications
   */
  private async registerServiceWorker(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register("/sw-push.js");
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.error("Service worker registration failed:", error);
        throw error;
      }
    } else {
      throw new Error("Service workers are not supported in this browser");
    }
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  /**
   * Get notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if ("Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  }
}
