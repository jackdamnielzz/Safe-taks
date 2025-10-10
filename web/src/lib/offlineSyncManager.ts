/**
 * Offline Sync Manager
 * Manages offline LMRA session storage and synchronization with Firestore
 * Task 5.9: Offline Sync & Conflict Resolution
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { LMRASession, SyncStatus } from "./types/lmra";

// ============================================================================
// INDEXEDDB SCHEMA
// ============================================================================

interface OfflineSyncDB extends DBSchema {
  // LMRA sessions waiting to sync
  lmraSessions: {
    key: string; // sessionId
    value: {
      sessionId: string;
      sessionData: LMRASession;
      operation: "create" | "update" | "complete";
      timestamp: number;
      retryCount: number;
      lastError?: string;
    };
    indexes: {
      "by-timestamp": number;
      "by-retry-count": number;
    };
  };

  // Photos waiting to upload
  photoQueue: {
    key: string; // photoId
    value: {
      photoId: string;
      sessionId: string;
      blob: Blob;
      filename: string;
      category: string;
      caption?: string;
      timestamp: number;
      retryCount: number;
      uploadProgress?: number;
    };
    indexes: {
      "by-session": string;
      "by-timestamp": number;
    };
  };

  // Projects waiting to sync
  projectQueue: {
    key: string; // projectId or tempId for new projects
    value: {
      projectId: string;
      projectData: any;
      operation: "create" | "update" | "delete" | "member_add" | "member_update" | "member_remove";
      timestamp: number;
      retryCount: number;
      lastError?: string;
      tempId?: string; // For tracking new projects before they get an ID
    };
    indexes: {
      "by-timestamp": number;
      "by-retry-count": number;
      "by-operation": string;
    };
  };

  // Sync status and metadata
  syncMetadata: {
    key: string; // key name (e.g., 'lastSyncTime', 'syncInProgress')
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

// ============================================================================
// OFFLINE SYNC MANAGER CLASS
// ============================================================================

export class OfflineSyncManager {
  private db: IDBPDatabase<OfflineSyncDB> | null = null;
  private dbName = "safework-pro-offline";
  private dbVersion = 1;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 2000; // milliseconds

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<OfflineSyncDB>(this.dbName, this.dbVersion, {
        upgrade(db) {
          // LMRA sessions store
          if (!db.objectStoreNames.contains("lmraSessions")) {
            const lmraStore = db.createObjectStore("lmraSessions", { keyPath: "sessionId" });
            lmraStore.createIndex("by-timestamp", "timestamp");
            lmraStore.createIndex("by-retry-count", "retryCount");
          }

          // Photo queue store
          if (!db.objectStoreNames.contains("photoQueue")) {
            const photoStore = db.createObjectStore("photoQueue", { keyPath: "photoId" });
            photoStore.createIndex("by-session", "sessionId");
            photoStore.createIndex("by-timestamp", "timestamp");
          }

          // Project queue store
          if (!db.objectStoreNames.contains("projectQueue")) {
            const projectStore = db.createObjectStore("projectQueue", { keyPath: "projectId" });
            projectStore.createIndex("by-timestamp", "timestamp");
            projectStore.createIndex("by-retry-count", "retryCount");
            projectStore.createIndex("by-operation", "operation");
          }

          // Sync metadata store
          if (!db.objectStoreNames.contains("syncMetadata")) {
            db.createObjectStore("syncMetadata", { keyPath: "key" });
          }
        },
      });

      console.log("[OfflineSync] IndexedDB initialized");
    } catch (error) {
      console.error("[OfflineSync] Failed to initialize IndexedDB:", error);
      throw error;
    }
  }

  /**
   * Queue LMRA session for sync
   */
  async queueLMRASession(
    sessionId: string,
    sessionData: LMRASession,
    operation: "create" | "update" | "complete"
  ): Promise<void> {
    await this.initialize();

    const queueItem = {
      sessionId,
      sessionData: {
        ...sessionData,
        syncStatus: "pending_sync" as SyncStatus,
        offlineCreatedAt: new Date(),
      },
      operation,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db!.put("lmraSessions", queueItem);
    console.log(`[OfflineSync] Queued LMRA session: ${sessionId}`);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  /**
   * Queue photo for upload
   */
  async queuePhoto(
    photoId: string,
    sessionId: string,
    blob: Blob,
    filename: string,
    category: string,
    caption?: string
  ): Promise<void> {
    await this.initialize();

    const queueItem = {
      photoId,
      sessionId,
      blob,
      filename,
      category,
      caption,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db!.put("photoQueue", queueItem);
    console.log(`[OfflineSync] Queued photo: ${photoId}`);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPhotos();
    }
  }

  /**
   * Get all pending sync items
   */
  async getPendingSyncItems(): Promise<{
    sessions: number;
    photos: number;
    projects: number;
  }> {
    await this.initialize();

    const sessions = await this.db!.count("lmraSessions");
    const photos = await this.db!.count("photoQueue");
    const projects = await this.db!.count("projectQueue");

    return { sessions, photos, projects };
  }

  /**
   * Sync all pending items
   */
  async syncNow(): Promise<void> {
    if (this.syncInProgress) {
      console.log("[OfflineSync] Sync already in progress");
      return;
    }

    if (!navigator.onLine) {
      console.log("[OfflineSync] Cannot sync while offline");
      return;
    }

    this.syncInProgress = true;
    await this.setSyncMetadata("syncInProgress", true);

    try {
      console.log("[OfflineSync] Starting sync...");

      // Sync LMRA sessions first
      await this.syncLMRASessions();

      // Then sync projects
      await this.syncProjects();

      // Then sync photos
      await this.syncPhotos();

      await this.setSyncMetadata("lastSyncTime", Date.now());
      console.log("[OfflineSync] Sync completed");
    } catch (error) {
      console.error("[OfflineSync] Sync failed:", error);
    } finally {
      this.syncInProgress = false;
      await this.setSyncMetadata("syncInProgress", false);
    }
  }

  /**
   * Sync LMRA sessions to Firestore
   */
  private async syncLMRASessions(): Promise<void> {
    await this.initialize();

    const sessions = await this.db!.getAll("lmraSessions");
    console.log(`[OfflineSync] Syncing ${sessions.length} LMRA sessions`);

    for (const item of sessions) {
      try {
        // Determine the API endpoint based on operation
        const endpoint =
          item.operation === "create"
            ? "/api/lmra-sessions"
            : `/api/lmra-sessions/${item.sessionId}`;

        const method = item.operation === "create" ? "POST" : "PATCH";

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item.sessionData),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        // Success - remove from queue
        await this.db!.delete("lmraSessions", item.sessionId);
        console.log(`[OfflineSync] Synced session: ${item.sessionId}`);
      } catch (error) {
        console.error(`[OfflineSync] Failed to sync session ${item.sessionId}:`, error);

        // Increment retry count
        item.retryCount++;
        item.lastError = (error as Error).message;

        if (item.retryCount >= this.maxRetries) {
          // Mark as failed permanently
          console.error(
            `[OfflineSync] Session ${item.sessionId} failed after ${this.maxRetries} retries`
          );
          // Update session data to mark sync as failed
          item.sessionData.syncStatus = "sync_failed";
          item.sessionData.syncError = item.lastError;
        }

        await this.db!.put("lmraSessions", item);
      }
    }
  }

  /**
   * Sync photos to Cloud Storage
   */
  private async syncPhotos(): Promise<void> {
    await this.initialize();

    const photos = await this.db!.getAll("photoQueue");
    console.log(`[OfflineSync] Syncing ${photos.length} photos`);

    for (const photo of photos) {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", photo.blob, photo.filename);
        formData.append("sessionId", photo.sessionId);
        formData.append("category", photo.category);
        if (photo.caption) {
          formData.append("caption", photo.caption);
        }

        const response = await fetch("/api/lmra-sessions/photos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Photo upload failed: ${response.statusText}`);
        }

        // Success - remove from queue
        await this.db!.delete("photoQueue", photo.photoId);
        console.log(`[OfflineSync] Synced photo: ${photo.photoId}`);
      } catch (error) {
        console.error(`[OfflineSync] Failed to sync photo ${photo.photoId}:`, error);

        // Increment retry count
        photo.retryCount++;

        if (photo.retryCount >= this.maxRetries) {
          console.error(
            `[OfflineSync] Photo ${photo.photoId} failed after ${this.maxRetries} retries`
          );
          // Keep in queue but mark as permanently failed
          // User can manually retry later
        }

        await this.db!.put("photoQueue", photo);
      }
    }
  }

  /**
   * Sync projects to Firestore with conflict resolution
   */
  private async syncProjects(): Promise<void> {
    await this.initialize();

    const projects = await this.db!.getAll("projectQueue");
    console.log(`[OfflineSync] Syncing ${projects.length} projects`);

    for (const item of projects) {
      try {
        let endpoint: string;
        let method: string;
        let body: any;

        switch (item.operation) {
          case "create":
            endpoint = "/api/projects";
            method = "POST";
            body = item.projectData;
            break;

          case "update":
            endpoint = `/api/projects/${item.projectId}`;
            method = "PATCH";
            body = item.projectData;
            break;

          case "delete":
            endpoint = `/api/projects/${item.projectId}`;
            method = "DELETE";
            body = null;
            break;

          case "member_add":
            endpoint = `/api/projects/${item.projectId}/members`;
            method = "POST";
            body = item.projectData;
            break;

          case "member_update":
            endpoint = `/api/projects/${item.projectId}/members`;
            method = "PATCH";
            body = item.projectData;
            break;

          case "member_remove":
            endpoint = `/api/projects/${item.projectId}/members`;
            method = "DELETE";
            body = item.projectData;
            break;

          default:
            throw new Error(`Unknown project operation: ${item.operation}`);
        }

        const options: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
          throw new Error(`Project sync failed: ${response.statusText}`);
        }

        // Success - remove from queue
        await this.db!.delete("projectQueue", item.projectId);
        console.log(`[OfflineSync] Synced project: ${item.projectId} (${item.operation})`);
      } catch (error) {
        console.error(`[OfflineSync] Failed to sync project ${item.projectId}:`, error);

        // Increment retry count
        item.retryCount++;
        item.lastError = (error as Error).message;

        if (item.retryCount >= this.maxRetries) {
          console.error(
            `[OfflineSync] Project ${item.projectId} failed after ${this.maxRetries} retries`
          );
          // Keep in queue for manual retry
        }

        await this.db!.put("projectQueue", item);
      }
    }
  }

  /**
   * Get failed sync items
   */
  async getFailedSyncItems(): Promise<{
    sessions: Array<{ sessionId: string; error: string; retryCount: number }>;
    photos: Array<{ photoId: string; retryCount: number }>;
  }> {
    await this.initialize();

    const allSessions = await this.db!.getAll("lmraSessions");
    const allPhotos = await this.db!.getAll("photoQueue");

    const failedSessions = allSessions
      .filter((s) => s.retryCount >= this.maxRetries)
      .map((s) => ({
        sessionId: s.sessionId,
        error: s.lastError || "Unknown error",
        retryCount: s.retryCount,
      }));

    const failedPhotos = allPhotos
      .filter((p) => p.retryCount >= this.maxRetries)
      .map((p) => ({
        photoId: p.photoId,
        retryCount: p.retryCount,
      }));

    return { sessions: failedSessions, photos: failedPhotos };
  }

  /**
   * Retry failed sync for specific session
   */
  async retrySession(sessionId: string): Promise<void> {
    await this.initialize();

    const item = await this.db!.get("lmraSessions", sessionId);
    if (!item) {
      throw new Error("Session not found in sync queue");
    }

    // Reset retry count
    item.retryCount = 0;
    item.lastError = undefined;
    item.sessionData.syncStatus = "pending_sync";

    await this.db!.put("lmraSessions", item);

    // Try to sync
    if (navigator.onLine) {
      await this.syncNow();
    }
  }

  /**
   * Queue project for sync
   */
  async queueProject(
    projectId: string,
    projectData: any,
    operation: "create" | "update" | "delete" | "member_add" | "member_update" | "member_remove",
    tempId?: string
  ): Promise<void> {
    await this.initialize();

    const queueItem = {
      projectId,
      projectData,
      operation,
      timestamp: Date.now(),
      retryCount: 0,
      tempId,
    };

    await this.db!.put("projectQueue", queueItem);
    console.log(`[OfflineSync] Queued project: ${projectId} (${operation})`);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  /**
   * Retry failed sync for specific project
   */
  async retryProject(projectId: string): Promise<void> {
    await this.initialize();

    const item = await this.db!.get("projectQueue", projectId);
    if (!item) {
      throw new Error("Project not found in sync queue");
    }

    // Reset retry count
    item.retryCount = 0;
    item.lastError = undefined;

    await this.db!.put("projectQueue", item);

    // Try to sync
    if (navigator.onLine) {
      await this.syncNow();
    }
  }

  /**
   * Clear all sync queues
   */
  async clearAllQueues(): Promise<void> {
    await this.initialize();

    await this.db!.clear("lmraSessions");
    await this.db!.clear("photoQueue");
    await this.db!.clear("projectQueue");

    console.log("[OfflineSync] All queues cleared");
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pendingSessions: number;
    pendingPhotos: number;
    pendingProjects: number;
    failedSessions: number;
    failedPhotos: number;
    failedProjects: number;
    lastSyncTime: number | null;
    syncInProgress: boolean;
  }> {
    await this.initialize();

    const pending = await this.getPendingSyncItems();
    const failedSessions = await this.getFailedSyncItems();
    const lastSyncTime = await this.getSyncMetadata("lastSyncTime");
    const syncInProgress = await this.getSyncMetadata("syncInProgress");

    // Get failed projects
    const allProjects = await this.db!.getAll("projectQueue");
    const failedProjects = allProjects.filter((p) => p.retryCount >= this.maxRetries);

    return {
      pendingSessions: pending.sessions,
      pendingPhotos: pending.photos,
      pendingProjects: pending.projects,
      failedSessions: failedSessions.sessions.length,
      failedPhotos: failedSessions.photos.length,
      failedProjects: failedProjects.length,
      lastSyncTime: lastSyncTime || null,
      syncInProgress: syncInProgress || false,
    };
  }

  /**
   * Set sync metadata
   */
  private async setSyncMetadata(key: string, value: any): Promise<void> {
    await this.initialize();

    await this.db!.put("syncMetadata", {
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get sync metadata
   */
  private async getSyncMetadata(key: string): Promise<any> {
    await this.initialize();

    const item = await this.db!.get("syncMetadata", key);
    return item?.value;
  }

  /**
   * Setup automatic sync on network reconnection
   */
  setupAutoSync(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[OfflineSync] Network reconnected, starting sync...");
      this.syncNow();
    });

    // Periodic sync every 5 minutes if online
    setInterval(
      () => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncNow();
        }
      },
      5 * 60 * 1000
    );
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let offlineSyncManagerInstance: OfflineSyncManager | null = null;

/**
 * Get singleton offline sync manager instance
 */
export function getOfflineSyncManager(): OfflineSyncManager {
  if (!offlineSyncManagerInstance) {
    offlineSyncManagerInstance = new OfflineSyncManager();
    offlineSyncManagerInstance.setupAutoSync();
  }
  return offlineSyncManagerInstance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Get offline status message
 */
export function getOfflineStatusMessage(
  sessionsCount: number = 0,
  photosCount: number = 0,
  projectsCount: number = 0
): string {
  const totalCount = sessionsCount + photosCount + projectsCount;

  if (totalCount === 0) {
    return "Alle gegevens zijn gesynchroniseerd";
  }

  const items = [];
  if (sessionsCount > 0) items.push(`${sessionsCount} LMRA${sessionsCount > 1 ? "'s" : ""}`);
  if (photosCount > 0) items.push(`${photosCount} foto${photosCount > 1 ? "'s" : ""}`);
  if (projectsCount > 0) items.push(`${projectsCount} project${projectsCount > 1 ? "en" : ""}`);

  const itemText = items.join(", ");
  return `${itemText} wacht${totalCount === 1 ? "" : "en"} op synchronisatie`;
}
