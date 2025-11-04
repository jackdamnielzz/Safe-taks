/**
 * Photo Upload Service
 * 
 * Handles photo compression and upload to Firebase Storage.
 * Integrates with photoStorage for offline support and sync management.
 * 
 * Features:
 * - Image compression using browser-image-compression
 * - Upload to Firebase Storage with progress tracking
 * - Automatic retry with exponential backoff
 * - Thumbnail generation
 * - Firestore metadata storage
 * - Offline queue management
 */

import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';
import { photoStorage, StoredPhoto } from './photoStorage';
import type { LMRAPhoto, LMRAStepNumber } from './types/lmra';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
  initialQuality?: number;
}

export interface UploadProgress {
  photoId: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'error';
  error?: string;
}

export interface UploadResult {
  photoId: string;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
  };
}

const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 2, // Target 2MB max
  maxWidthOrHeight: 2048, // Max dimension
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
};

const THUMBNAIL_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.1, // 100KB max for thumbnails
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.7,
};

export class PhotoUploadService {
  private static instance: PhotoUploadService;
  private activeUploads: Map<string, UploadTask> = new Map();
  private uploadQueue: string[] = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    // Initialize photo storage
    photoStorage.init().catch(console.error);
  }

  static getInstance(): PhotoUploadService {
    if (!PhotoUploadService.instance) {
      PhotoUploadService.instance = new PhotoUploadService();
    }
    return PhotoUploadService.instance;
  }

  /**
   * Compress image before upload
   */
  async compressImage(
    blob: Blob,
    options: Partial<CompressionOptions> = {}
  ): Promise<{ compressed: Blob; originalSize: number; compressedSize: number }> {
    const compressionOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
    
    try {
      const file = new File([blob], 'photo.jpg', { type: blob.type });
      const originalSize = file.size;
      
      const compressed = await imageCompression(file, compressionOptions);
      const compressedSize = compressed.size;
      
      console.log(`Compressed image: ${originalSize} -> ${compressedSize} bytes (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`);
      
      return {
        compressed,
        originalSize,
        compressedSize,
      };
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(blob: Blob): Promise<Blob> {
    try {
      const file = new File([blob], 'thumbnail.jpg', { type: blob.type });
      const thumbnail = await imageCompression(file, THUMBNAIL_OPTIONS);
      return thumbnail;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Upload photo to Firebase Storage
   */
  async uploadPhoto(
    storedPhoto: StoredPhoto,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const { id, lmraId, blob, metadata } = storedPhoto;

    try {
      // Update status to syncing
      await photoStorage.updateSyncStatus(id, 'syncing', undefined, 0);

      // Compress image
      const { compressed, originalSize, compressedSize } = await this.compressImage(blob);
      
      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(compressed);

      // Upload main image
      const mainPath = `lmras/${lmraId}/photos/${id}.jpg`;
      const mainRef = ref(storage, mainPath);
      const mainUploadTask = uploadBytesResumable(mainRef, compressed, {
        contentType: 'image/jpeg',
        customMetadata: {
          lmraId,
          photoId: id,
          originalSize: originalSize.toString(),
          compressedSize: compressedSize.toString(),
        },
      });

      // Track active upload
      this.activeUploads.set(id, mainUploadTask);

      // Monitor upload progress
      const mainUrl = await new Promise<string>((resolve, reject) => {
        mainUploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            
            // Update local storage
            photoStorage.updateSyncStatus(id, 'syncing', undefined, progress).catch(console.error);
            
            // Notify callback
            if (onProgress) {
              onProgress({
                photoId: id,
                progress,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                state: snapshot.state as 'running' | 'paused',
              });
            }
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(mainUploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      // Upload thumbnail
      const thumbnailPath = `lmras/${lmraId}/photos/thumbnails/${id}_thumb.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytesResumable(thumbnailRef, thumbnail, {
        contentType: 'image/jpeg',
      });
      const thumbnailUrl = await getDownloadURL(thumbnailRef);

      // Save metadata to Firestore
      const photoDoc: LMRAPhoto = {
        id,
        lmraId,
        stepNumber: storedPhoto.stepNumber as LMRAStepNumber,
        url: mainUrl,
        thumbnailUrl,
        caption: storedPhoto.caption,
        uploadedBy: storedPhoto.uploadedBy,
        uploadedAt: storedPhoto.uploadedAt,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          size: compressedSize,
          mimeType: metadata.mimeType,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
        },
        syncStatus: 'synced',
      };

      await setDoc(doc(db, 'lmraPhotos', id), {
        ...photoDoc,
        uploadedAt: serverTimestamp(),
      });

      // Update local storage
      await photoStorage.updateAfterUpload(id, mainUrl, thumbnailUrl);

      // Remove from active uploads
      this.activeUploads.delete(id);

      // Notify success
      if (onProgress) {
        onProgress({
          photoId: id,
          progress: 100,
          bytesTransferred: compressedSize,
          totalBytes: compressedSize,
          state: 'success',
        });
      }

      return {
        photoId: id,
        url: mainUrl,
        thumbnailUrl,
        metadata: {
          originalSize,
          compressedSize,
          compressionRatio: (1 - compressedSize / originalSize) * 100,
          width: metadata.width,
          height: metadata.height,
        },
      };
    } catch (error) {
      // Update status to failed
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      await photoStorage.updateSyncStatus(id, 'sync_failed', errorMessage, 0);

      // Remove from active uploads
      this.activeUploads.delete(id);

      // Notify error
      if (onProgress) {
        onProgress({
          photoId: id,
          progress: 0,
          bytesTransferred: 0,
          totalBytes: 0,
          state: 'error',
          error: errorMessage,
        });
      }

      throw error;
    }
  }

  /**
   * Upload photo with automatic retry
   */
  async uploadPhotoWithRetry(
    storedPhoto: StoredPhoto,
    maxRetries: number = 3,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadPhoto(storedPhoto, onProgress);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed');
        console.error(`Upload attempt ${attempt} failed:`, lastError);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 2^attempt seconds
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Upload failed after retries');
  }

  /**
   * Add photo to upload queue
   */
  async queueUpload(photoId: string): Promise<void> {
    if (!this.uploadQueue.includes(photoId)) {
      this.uploadQueue.push(photoId);
      await photoStorage.updateSyncStatus(photoId, 'pending_sync');
    }
    
    // Start processing queue if not already running
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.uploadQueue.length > 0) {
      const photoId = this.uploadQueue.shift();
      if (!photoId) continue;

      try {
        const storedPhoto = await photoStorage.getPhoto(photoId);
        if (!storedPhoto) {
          console.warn(`Photo ${photoId} not found in storage`);
          continue;
        }

        await this.uploadPhotoWithRetry(storedPhoto);
      } catch (error) {
        console.error(`Failed to upload photo ${photoId}:`, error);
        // Photo status already updated to sync_failed in uploadPhoto
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Sync all pending photos
   */
  async syncPendingPhotos(
    onProgress?: (photoId: string, progress: UploadProgress) => void
  ): Promise<{ success: number; failed: number }> {
    const pendingPhotos = await photoStorage.getPendingPhotos();
    let success = 0;
    let failed = 0;

    for (const photo of pendingPhotos) {
      try {
        await this.uploadPhotoWithRetry(photo, 3, (progress) => {
          if (onProgress) {
            onProgress(photo.id, progress);
          }
        });
        success++;
      } catch (error) {
        console.error(`Failed to sync photo ${photo.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Cancel active upload
   */
  async cancelUpload(photoId: string): Promise<void> {
    const uploadTask = this.activeUploads.get(photoId);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(photoId);
      await photoStorage.updateSyncStatus(photoId, 'pending', 'Upload cancelled', 0);
    }
  }

  /**
   * Get active upload progress
   */
  getUploadProgress(photoId: string): number | null {
    const uploadTask = this.activeUploads.get(photoId);
    if (!uploadTask || !uploadTask.snapshot) {
      return null;
    }
    return (uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100;
  }

  /**
   * Check if photo is currently uploading
   */
  isUploading(photoId: string): boolean {
    return this.activeUploads.has(photoId);
  }

  /**
   * Get count of active uploads
   */
  getActiveUploadCount(): number {
    return this.activeUploads.size;
  }
}

// Export singleton instance
export const photoUpload = PhotoUploadService.getInstance();
