/**
 * Photo Storage Service
 *
 * Manages local storage of photos using IndexedDB for offline support.
 * Photos are stored locally until successfully uploaded to Firebase Storage.
 *
 * Features:
 * - Store photos in IndexedDB
 * - CRUD operations for photos
 * - Sync queue management
 * - Storage quota handling
 * - Automatic cleanup after successful upload
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { LMRAPhoto, SyncStatus } from "./types/lmra";

interface PhotoStorageSchema extends DBSchema {
  photos: {
    key: string;
    value: StoredPhoto;
    indexes: {
      "by-lmra": string;
      "by-sync-status": SyncStatus;
      "by-step": number;
    };
  };
}

export interface StoredPhoto {
  id: string;
  lmraId: string;
  stepNumber: number;
  blob: Blob;
  dataUrl: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata: {
    width: number;
    height: number;
    size: number;
    mimeType: string;
    latitude?: number;
    longitude?: number;
  };
  syncStatus: SyncStatus;
  syncError?: string;
  uploadProgress?: number;
  firebaseUrl?: string;
  thumbnailUrl?: string;
}

const DB_NAME = "lmra-photos";
const DB_VERSION = 1;
const STORE_NAME = "photos";

export class PhotoStorageService {
  private static instance: PhotoStorageService;
  private db: IDBPDatabase<PhotoStorageSchema> | null = null;

  private constructor() {}

  static getInstance(): PhotoStorageService {
    if (!PhotoStorageService.instance) {
      PhotoStorageService.instance = new PhotoStorageService();
    }
    return PhotoStorageService.instance;
  }

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = await openDB<PhotoStorageSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create photos store
          const photoStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });

          // Create indexes
          photoStore.createIndex("by-lmra", "lmraId");
          photoStore.createIndex("by-sync-status", "syncStatus");
          photoStore.createIndex("by-step", "stepNumber");
        },
      });
    } catch (error) {
      console.error("Failed to initialize photo storage:", error);
      throw new Error("Failed to initialize photo storage");
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBPDatabase<PhotoStorageSchema>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  /**
   * Save photo to IndexedDB
   */
  async savePhoto(photo: StoredPhoto): Promise<void> {
    const db = await this.ensureDb();

    try {
      await db.put(STORE_NAME, photo);
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        throw new Error(
          "Storage quota exceeded. Please delete some photos or upload pending photos."
        );
      }
      throw error;
    }
  }

  /**
   * Get photo by ID
   */
  async getPhoto(id: string): Promise<StoredPhoto | undefined> {
    const db = await this.ensureDb();
    return db.get(STORE_NAME, id);
  }

  /**
   * Get all photos for an LMRA
   */
  async getPhotosByLmra(lmraId: string): Promise<StoredPhoto[]> {
    const db = await this.ensureDb();
    return db.getAllFromIndex(STORE_NAME, "by-lmra", lmraId);
  }

  /**
   * Get photos by sync status
   */
  async getPhotosBySyncStatus(status: SyncStatus): Promise<StoredPhoto[]> {
    const db = await this.ensureDb();
    return db.getAllFromIndex(STORE_NAME, "by-sync-status", status);
  }

  /**
   * Get photos for a specific LMRA step
   */
  async getPhotosByStep(lmraId: string, stepNumber: number): Promise<StoredPhoto[]> {
    const db = await this.ensureDb();
    const allPhotos = await db.getAllFromIndex(STORE_NAME, "by-lmra", lmraId);
    return allPhotos.filter((photo) => photo.stepNumber === stepNumber);
  }

  /**
   * Update photo sync status
   */
  async updateSyncStatus(
    id: string,
    status: SyncStatus,
    error?: string,
    progress?: number
  ): Promise<void> {
    const db = await this.ensureDb();
    const photo = await db.get(STORE_NAME, id);

    if (!photo) {
      throw new Error(`Photo ${id} not found`);
    }

    photo.syncStatus = status;
    if (error !== undefined) {
      photo.syncError = error;
    }
    if (progress !== undefined) {
      photo.uploadProgress = progress;
    }

    await db.put(STORE_NAME, photo);
  }

  /**
   * Update photo with Firebase URLs after successful upload
   */
  async updateAfterUpload(id: string, firebaseUrl: string, thumbnailUrl?: string): Promise<void> {
    const db = await this.ensureDb();
    const photo = await db.get(STORE_NAME, id);

    if (!photo) {
      throw new Error(`Photo ${id} not found`);
    }

    photo.firebaseUrl = firebaseUrl;
    photo.thumbnailUrl = thumbnailUrl;
    photo.syncStatus = "synced";
    photo.uploadProgress = 100;
    photo.syncError = undefined;

    await db.put(STORE_NAME, photo);
  }

  /**
   * Delete photo
   */
  async deletePhoto(id: string): Promise<void> {
    const db = await this.ensureDb();
    await db.delete(STORE_NAME, id);
  }

  /**
   * Delete all photos for an LMRA
   */
  async deletePhotosByLmra(lmraId: string): Promise<void> {
    const db = await this.ensureDb();
    const photos = await this.getPhotosByLmra(lmraId);

    const tx = db.transaction(STORE_NAME, "readwrite");
    await Promise.all([...photos.map((photo) => tx.store.delete(photo.id)), tx.done]);
  }

  /**
   * Get pending photos (not yet uploaded)
   */
  async getPendingPhotos(): Promise<StoredPhoto[]> {
    const db = await this.ensureDb();
    const allPhotos = await db.getAll(STORE_NAME);
    return allPhotos.filter(
      (photo) => photo.syncStatus === "pending" || photo.syncStatus === "pending_sync"
    );
  }

  /**
   * Get failed photos (upload failed)
   */
  async getFailedPhotos(): Promise<StoredPhoto[]> {
    const db = await this.ensureDb();
    return db.getAllFromIndex(STORE_NAME, "by-sync-status", "sync_failed");
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    }

    return { usage: 0, quota: 0, percentage: 0 };
  }

  /**
   * Check if storage is nearly full (>80%)
   */
  async isStorageNearlyFull(): Promise<boolean> {
    const { percentage } = await this.getStorageEstimate();
    return percentage > 80;
  }

  /**
   * Clean up synced photos older than specified days
   */
  async cleanupOldSyncedPhotos(daysOld: number = 7): Promise<number> {
    const db = await this.ensureDb();
    const allPhotos = await db.getAll(STORE_NAME);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const photosToDelete = allPhotos.filter(
      (photo) => photo.syncStatus === "synced" && new Date(photo.uploadedAt) < cutoffDate
    );

    const tx = db.transaction(STORE_NAME, "readwrite");
    await Promise.all([...photosToDelete.map((photo) => tx.store.delete(photo.id)), tx.done]);

    return photosToDelete.length;
  }

  /**
   * Get total count of photos
   */
  async getPhotoCount(): Promise<number> {
    const db = await this.ensureDb();
    return db.count(STORE_NAME);
  }

  /**
   * Get photo count by LMRA
   */
  async getPhotoCountByLmra(lmraId: string): Promise<number> {
    const db = await this.ensureDb();
    return db.countFromIndex(STORE_NAME, "by-lmra", lmraId);
  }

  /**
   * Clear all photos (use with caution!)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    await db.clear(STORE_NAME);
  }

  /**
   * Export photo metadata (without blobs) for debugging
   */
  async exportMetadata(): Promise<Omit<StoredPhoto, "blob" | "dataUrl">[]> {
    const db = await this.ensureDb();
    const allPhotos = await db.getAll(STORE_NAME);

    return allPhotos.map(({ blob, dataUrl, ...metadata }) => metadata);
  }
}

// Export singleton instance
export const photoStorage = PhotoStorageService.getInstance();
