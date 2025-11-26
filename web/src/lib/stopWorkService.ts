/**
 * Stop-Work Service
 * Handles emergency work stoppage alerts with offline support
 * W1.6: Stop-Work Authority Implementation
 */

import { StopWorkAlert, CreateStopWorkRequest } from "./types/lmra";
import { getOfflineSyncManager } from "./offlineSyncManager";

// ============================================================================
// STOP-WORK SERVICE CLASS
// ============================================================================

export class StopWorkService {
  private syncManager = getOfflineSyncManager();

  /**
   * Create stop-work alert (works offline)
   */
  async createStopWorkAlert(request: CreateStopWorkRequest): Promise<StopWorkAlert> {
    const alertId = `stopwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: StopWorkAlert = {
      id: alertId,
      lmraId: request.lmraId,
      organizationId: "", // Will be filled from auth context
      projectId: undefined,
      traId: undefined,

      // Who triggered
      triggeredBy: request.triggeredBy,
      triggeredByName: request.triggeredByName,
      triggeredAt: new Date(),

      // Why
      reason: request.reason,
      severity: request.severity,
      category: request.category,

      // Evidence
      description: request.description,
      photoIds: request.photoIds || [],

      // Location
      location: request.location,

      // Signature
      signature: {
        ...request.signature,
        signedAt: new Date(),
      },

      // Status
      status: "active",

      // Notifications
      notifiedUsers: [],
      notificationsSent: false,

      // Sync
      syncStatus: navigator.onLine ? "pending" : "pending_sync",
      createdAt: new Date(),
    };

    // Queue for sync if offline, or sync immediately if online
    if (!navigator.onLine) {
      await this.queueStopWorkAlert(alert);
      console.log(`[StopWork] Alert ${alertId} queued for sync (offline)`);
    } else {
      try {
        await this.syncStopWorkAlert(alert);
        console.log(`[StopWork] Alert ${alertId} synced successfully`);
      } catch (error) {
        // If sync fails, queue it
        console.error(`[StopWork] Failed to sync alert ${alertId}, queuing:`, error);
        await this.queueStopWorkAlert(alert);
      }
    }

    return alert;
  }

  /**
   * Queue stop-work alert for offline sync
   */
  private async queueStopWorkAlert(alert: StopWorkAlert): Promise<void> {
    await this.syncManager.initialize();

    const queueItem = {
      alertId: alert.id,
      alertData: alert,
      timestamp: Date.now(),
      retryCount: 0,
      notificationPending: true,
    };

    // Access the private db through a workaround - we'll add a public method
    // For now, store in localStorage as fallback
    const queue = this.getStopWorkQueue();
    queue.push(queueItem);
    this.saveStopWorkQueue(queue);
  }

  /**
   * Sync stop-work alert to server
   */
  private async syncStopWorkAlert(alert: StopWorkAlert): Promise<void> {
    // Convert alert to API request format
    const requestBody = {
      triggeredBy: alert.triggeredBy,
      triggeredByName: alert.triggeredByName,
      reason: alert.reason,
      severity: alert.severity,
      category: alert.category,
      description: alert.description,
      photoIds: alert.photoIds,
      signature: alert.signature,
    };

    const response = await fetch(`/api/lmras/${alert.lmraId}/stop-work`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create stop-work alert");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get pending stop-work alerts from queue
   */
  async getPendingStopWorkAlerts(): Promise<StopWorkAlert[]> {
    const queue = this.getStopWorkQueue();
    return queue.map((item) => item.alertData);
  }

  /**
   * Sync all pending stop-work alerts
   */
  async syncPendingAlerts(): Promise<void> {
    if (!navigator.onLine) {
      console.log("[StopWork] Cannot sync while offline");
      return;
    }

    const queue = this.getStopWorkQueue();
    const failedItems: any[] = [];

    for (const item of queue) {
      try {
        await this.syncStopWorkAlert(item.alertData);
        console.log(`[StopWork] Synced alert ${item.alertId}`);
      } catch (error) {
        console.error(`[StopWork] Failed to sync alert ${item.alertId}:`, error);
        item.retryCount++;

        if (item.retryCount < 3) {
          failedItems.push(item);
        } else {
          console.error(`[StopWork] Alert ${item.alertId} failed after 3 retries`);
        }
      }
    }

    // Save failed items back to queue
    this.saveStopWorkQueue(failedItems);
  }

  /**
   * Acknowledge stop-work alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/stop-work/${alertId}/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to acknowledge alert");
    }
  }

  /**
   * Resolve stop-work alert
   */
  async resolveAlert(alertId: string, resolutionNotes: string): Promise<void> {
    const response = await fetch(`/api/stop-work/${alertId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resolutionNotes }),
    });

    if (!response.ok) {
      throw new Error("Failed to resolve alert");
    }
  }

  /**
   * Get active stop-work alerts for organization
   */
  async getActiveAlerts(organizationId: string): Promise<StopWorkAlert[]> {
    const response = await fetch(`/api/stop-work?organizationId=${organizationId}&status=active`);

    if (!response.ok) {
      throw new Error("Failed to fetch active alerts");
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get stop-work queue from localStorage
   */
  private getStopWorkQueue(): any[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem("stopwork-queue");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("[StopWork] Failed to load queue:", error);
      return [];
    }
  }

  /**
   * Save stop-work queue to localStorage
   */
  private saveStopWorkQueue(queue: any[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("stopwork-queue", JSON.stringify(queue));
    } catch (error) {
      console.error("[StopWork] Failed to save queue:", error);
    }
  }

  /**
   * Setup auto-sync on network reconnection
   */
  setupAutoSync(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[StopWork] Network reconnected, syncing pending alerts...");
      this.syncPendingAlerts();
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let stopWorkServiceInstance: StopWorkService | null = null;

/**
 * Get singleton stop-work service instance
 */
export function getStopWorkService(): StopWorkService {
  if (!stopWorkServiceInstance) {
    stopWorkServiceInstance = new StopWorkService();
    stopWorkServiceInstance.setupAutoSync();
  }
  return stopWorkServiceInstance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get severity color for UI
 */
export function getStopWorkSeverityColor(severity: "moderate" | "high" | "critical"): string {
  const colors = {
    moderate: "#F59E0B", // Orange
    high: "#EF4444", // Red
    critical: "#DC2626", // Dark Red
  };
  return colors[severity];
}

/**
 * Get severity label in Dutch
 */
export function getStopWorkSeverityLabel(severity: "moderate" | "high" | "critical"): string {
  const labels = {
    moderate: "Matig",
    high: "Hoog",
    critical: "Kritiek",
  };
  return labels[severity];
}

/**
 * Get category label in Dutch
 */
export function getStopWorkCategoryLabel(
  category: "weather" | "equipment" | "personnel" | "hazard" | "other"
): string {
  const labels = {
    weather: "Weersomstandigheden",
    equipment: "Apparatuur",
    personnel: "Personeel",
    hazard: "Gevaar",
    other: "Overig",
  };
  return labels[category];
}
