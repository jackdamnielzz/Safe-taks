/**
 * Upload Types
 *
 * Type definitions for file upload metadata stored in Firestore.
 */

import { Timestamp } from "firebase/firestore";

export interface UploadMetadata {
  id: string;
  orgId: string;
  userId: string;

  // File information
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  size: number; // bytes

  // Image-specific metadata (if applicable)
  width?: number;
  height?: number;
  isImage: boolean;

  // Optimization info
  originalSize?: number;
  compressionRatio?: number;
  wasOptimized: boolean;

  // Timestamps
  createdAt: Timestamp;

  // Optional context
  context?: {
    type?: "tra" | "lmra" | "profile" | "organization" | "template" | "other";
    referenceId?: string; // ID of related TRA, LMRA, etc.
    description?: string;
  };

  // Status
  status: "uploading" | "completed" | "failed" | "deleted";
  error?: string;
}

export interface CreateUploadMetadataRequest {
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  originalSize?: number;
  compressionRatio?: number;
  context?: UploadMetadata["context"];
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: "running" | "paused" | "success" | "canceled" | "error";
}

export interface UploadResult {
  uploadId: string;
  downloadUrl: string;
  metadata: UploadMetadata;
}
