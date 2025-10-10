/**
 * Upload Helper Utilities
 *
 * Functions for uploading files to Firebase Storage and managing metadata in Firestore.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { storage, db } from "./firebase";
import { optimizeImage, getImageDimensions } from "./imageOptimization";
import type {
  UploadMetadata,
  CreateUploadMetadataRequest,
  UploadProgress,
  UploadResult,
} from "./types/upload";

/**
 * Generate unique upload ID
 */
function generateUploadId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get storage path for upload
 */
export function getUploadStoragePath(
  orgId: string,
  userId: string,
  uploadId: string,
  filename: string
): string {
  // Clean filename to avoid issues
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `organizations/${orgId}/uploads/${userId}/${uploadId}/${cleanFilename}`;
}

/**
 * Create upload metadata document in Firestore
 */
export async function createUploadMetadata(
  orgId: string,
  userId: string,
  uploadId: string,
  request: CreateUploadMetadataRequest
): Promise<void> {
  const isImage = request.mimeType.startsWith("image/");

  const metadata: UploadMetadata = {
    id: uploadId,
    orgId,
    userId,
    originalFilename: request.originalFilename,
    storagePath: request.storagePath,
    mimeType: request.mimeType,
    size: request.size,
    width: request.width,
    height: request.height,
    isImage,
    originalSize: request.originalSize,
    compressionRatio: request.compressionRatio,
    wasOptimized: !!request.originalSize && request.originalSize !== request.size,
    createdAt: Timestamp.now(),
    context: request.context,
    status: "uploading",
  };

  const uploadDoc = doc(db, `organizations/${orgId}/uploads`, uploadId);
  await setDoc(uploadDoc, metadata);
}

/**
 * Update upload metadata status
 */
export async function updateUploadStatus(
  orgId: string,
  uploadId: string,
  status: UploadMetadata["status"],
  error?: string
): Promise<void> {
  const uploadDoc = doc(db, `organizations/${orgId}/uploads`, uploadId);
  await updateDoc(uploadDoc, {
    status,
    ...(error && { error }),
  });
}

/**
 * Upload file to Firebase Storage with progress tracking
 */
export async function uploadFile(
  file: File,
  orgId: string,
  userId: string,
  options: {
    optimize?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    context?: UploadMetadata["context"];
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<UploadResult> {
  const {
    optimize = true,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    context,
    onProgress,
  } = options;

  try {
    // Generate upload ID
    const uploadId = generateUploadId();

    // Optimize image if needed
    let fileToUpload = file;
    let originalSize = file.size;
    let compressionRatio: number | undefined;
    let dimensions: { width?: number; height?: number } = {};

    if (optimize && file.type.startsWith("image/")) {
      const optimized = await optimizeImage(file, {
        maxWidth,
        maxHeight,
        quality,
      });
      fileToUpload = optimized.file;
      originalSize = optimized.originalSize;
      compressionRatio = optimized.compressionRatio;
      dimensions = {
        width: optimized.dimensions.width,
        height: optimized.dimensions.height,
      };
    } else if (file.type.startsWith("image/")) {
      // Get dimensions even if not optimizing
      const dims = await getImageDimensions(file);
      dimensions = { width: dims.width, height: dims.height };
    }

    // Create storage path
    const storagePath = getUploadStoragePath(orgId, userId, uploadId, file.name);

    // Create metadata in Firestore
    await createUploadMetadata(orgId, userId, uploadId, {
      originalFilename: file.name,
      storagePath,
      mimeType: file.type,
      size: fileToUpload.size,
      width: dimensions.width,
      height: dimensions.height,
      originalSize: originalSize !== fileToUpload.size ? originalSize : undefined,
      compressionRatio,
      context,
    });

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalFilename: file.name,
        uploadId,
      },
    });

    // Track progress
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state as UploadProgress["state"],
          };

          if (onProgress) {
            onProgress(progress);
          }
        },
        async (error) => {
          // Update status to failed
          await updateUploadStatus(orgId, uploadId, "failed", error.message);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Update status to completed
          await updateUploadStatus(orgId, uploadId, "completed");

          // Get metadata
          const uploadDoc = doc(db, `organizations/${orgId}/uploads`, uploadId);
          const uploadSnap = await getDoc(uploadDoc);
          const metadata = uploadSnap.data() as UploadMetadata;

          resolve({
            uploadId,
            downloadUrl,
            metadata,
          });
        }
      );
    });
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

/**
 * Delete upload (both storage and metadata)
 */
export async function deleteUpload(orgId: string, uploadId: string): Promise<void> {
  try {
    // Get upload metadata
    const uploadDoc = doc(db, `organizations/${orgId}/uploads`, uploadId);
    const uploadSnap = await getDoc(uploadDoc);

    if (!uploadSnap.exists()) {
      throw new Error("Upload not found");
    }

    const metadata = uploadSnap.data() as UploadMetadata;

    // Delete from storage
    const storageRef = ref(storage, metadata.storagePath);
    await deleteObject(storageRef);

    // Delete metadata
    await deleteDoc(uploadDoc);
  } catch (error) {
    console.error("Delete upload failed:", error);
    throw error;
  }
}

/**
 * Get upload metadata
 */
export async function getUploadMetadata(
  orgId: string,
  uploadId: string
): Promise<UploadMetadata | null> {
  const uploadDoc = doc(db, `organizations/${orgId}/uploads`, uploadId);
  const uploadSnap = await getDoc(uploadDoc);

  if (!uploadSnap.exists()) {
    return null;
  }

  return uploadSnap.data() as UploadMetadata;
}

/**
 * List uploads for a user
 */
export async function listUserUploads(
  orgId: string,
  userId: string,
  options: {
    maxResults?: number;
    contextType?: "tra" | "lmra" | "profile" | "organization" | "template" | "other";
  } = {}
): Promise<UploadMetadata[]> {
  const { maxResults = 50, contextType } = options;

  const uploadsRef = collection(db, `organizations/${orgId}/uploads`);
  let q = query(
    uploadsRef,
    where("userId", "==", userId),
    where("status", "==", "completed"),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );

  if (contextType) {
    q = query(
      uploadsRef,
      where("userId", "==", userId),
      where("status", "==", "completed"),
      where("context.type", "==", contextType),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
  }

  const querySnap = await getDocs(q);
  return querySnap.docs.map((doc) => doc.data() as UploadMetadata);
}

/**
 * Get upload download URL
 */
export async function getUploadDownloadUrl(storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  return await getDownloadURL(storageRef);
}
