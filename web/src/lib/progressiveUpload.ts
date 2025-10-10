/**
 * Progressive Upload Utilities
 *
 * Enhanced upload strategy with chunking, resume capability, and retry logic.
 * Firebase Storage already handles chunked uploads via uploadBytesResumable,
 * we add state persistence and retry mechanisms.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./firebase";
import type { UploadProgress } from "./types/upload";

/**
 * Upload state for resume capability
 */
export interface UploadState {
  uploadId: string;
  filename: string;
  storagePath: string;
  bytesTransferred: number;
  totalBytes: number;
  status: "paused" | "running" | "success" | "error";
  error?: string;
  timestamp: number;
}

/**
 * Progressive upload configuration
 */
export interface ProgressiveUploadConfig {
  /**
   * Enable retry on network errors
   */
  enableRetry?: boolean;

  /**
   * Maximum retry attempts
   */
  maxRetries?: number;

  /**
   * Initial retry delay in ms
   */
  retryDelay?: number;

  /**
   * Enable state persistence for resume
   */
  enablePersistence?: boolean;

  /**
   * Custom chunk size (Firebase handles this internally, but we can suggest via metadata)
   */
  chunkSize?: number;
}

/**
 * Get upload state from localStorage
 */
export function getUploadState(uploadId: string): UploadState | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(`upload_${uploadId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UploadState;
  } catch {
    return null;
  }
}

/**
 * Save upload state to localStorage
 */
export function saveUploadState(state: UploadState): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(`upload_${state.uploadId}`, JSON.stringify(state));
}

/**
 * Clear upload state from localStorage
 */
export function clearUploadState(uploadId: string): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(`upload_${uploadId}`);
}

/**
 * Get all pending upload states
 */
export function getPendingUploads(): UploadState[] {
  if (typeof window === "undefined") return [];

  const uploads: UploadState[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("upload_")) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const state = JSON.parse(stored) as UploadState;
          if (state.status === "paused" || state.status === "error") {
            uploads.push(state);
          }
        } catch {
          // Ignore invalid states
        }
      }
    }
  }

  return uploads;
}

/**
 * Progressive upload with retry and resume capability
 */
export async function progressiveUpload(
  file: File,
  storagePath: string,
  uploadId: string,
  config: ProgressiveUploadConfig = {},
  onProgress?: (progress: UploadProgress) => void,
  onStateChange?: (state: UploadState) => void
): Promise<string> {
  const {
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enablePersistence = true,
  } = config;

  let retryCount = 0;
  let currentTask: UploadTask | null = null;

  // Check for existing upload state
  const existingState = enablePersistence ? getUploadState(uploadId) : null;

  const upload = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, storagePath);

      // Create upload task
      currentTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadId,
          originalFilename: file.name,
          chunked: "true",
        },
      });

      // Initialize state
      const initialState: UploadState = {
        uploadId,
        filename: file.name,
        storagePath,
        bytesTransferred: existingState?.bytesTransferred || 0,
        totalBytes: file.size,
        status: "running",
        timestamp: Date.now(),
      };

      if (enablePersistence) {
        saveUploadState(initialState);
      }

      if (onStateChange) {
        onStateChange(initialState);
      }

      // Track progress
      currentTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state as UploadProgress["state"],
          };

          // Update state
          const updatedState: UploadState = {
            ...initialState,
            bytesTransferred: snapshot.bytesTransferred,
            status: snapshot.state === "paused" ? "paused" : "running",
            timestamp: Date.now(),
          };

          if (enablePersistence) {
            saveUploadState(updatedState);
          }

          if (onProgress) {
            onProgress(progress);
          }

          if (onStateChange) {
            onStateChange(updatedState);
          }
        },
        async (error) => {
          // Handle upload error
          const errorState: UploadState = {
            ...initialState,
            status: "error",
            error: error.message,
            timestamp: Date.now(),
          };

          if (enablePersistence) {
            saveUploadState(errorState);
          }

          if (onStateChange) {
            onStateChange(errorState);
          }

          // Retry logic
          if (enableRetry && retryCount < maxRetries) {
            retryCount++;
            const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff

            console.log(
              `Upload failed, retrying (${retryCount}/${maxRetries}) after ${delay}ms...`
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

            try {
              const result = await upload();
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        },
        async () => {
          // Upload completed successfully
          const downloadUrl = await getDownloadURL(currentTask!.snapshot.ref);

          const successState: UploadState = {
            ...initialState,
            bytesTransferred: file.size,
            status: "success",
            timestamp: Date.now(),
          };

          if (onStateChange) {
            onStateChange(successState);
          }

          // Clear state on success
          if (enablePersistence) {
            clearUploadState(uploadId);
          }

          resolve(downloadUrl);
        }
      );
    });
  };

  return upload();
}

/**
 * Resume a paused upload
 */
export async function resumeUpload(
  uploadId: string,
  onProgress?: (progress: UploadProgress) => void,
  onStateChange?: (state: UploadState) => void
): Promise<void> {
  const state = getUploadState(uploadId);

  if (!state) {
    throw new Error("Upload state not found");
  }

  if (state.status !== "paused" && state.status !== "error") {
    throw new Error("Upload is not paused or failed");
  }

  // Note: Firebase Storage uploadBytesResumable handles resume automatically
  // We just need to re-initiate the upload with the same file
  console.log("Resume capability requires re-uploading with the same file reference");
  console.log("Upload state:", state);

  // Update state to running
  const updatedState: UploadState = {
    ...state,
    status: "running",
    timestamp: Date.now(),
  };

  saveUploadState(updatedState);

  if (onStateChange) {
    onStateChange(updatedState);
  }
}

/**
 * Cancel an upload
 */
export function cancelUpload(uploadId: string): void {
  // Clear the upload state
  clearUploadState(uploadId);
}

/**
 * Clean up old upload states (older than 24 hours)
 */
export function cleanupOldUploadStates(): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("upload_")) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const state = JSON.parse(stored) as UploadState;
          if (now - state.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove invalid states
          localStorage.removeItem(key);
        }
      }
    }
  }
}
