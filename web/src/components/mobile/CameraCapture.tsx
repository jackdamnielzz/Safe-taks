"use client";
import React, { useRef, useState } from "react";
import { compressImage } from "@/lib/imageCompression";
import { uploadFile } from "@/lib/uploadHelpers";
import type { UploadResult, UploadMetadata } from "@/lib/types/upload";

interface CameraCaptureProps {
  orgId: string;
  userId: string;
  context?: UploadMetadata["context"];
  maxSizeMB?: number;
  onUploaded?: (result: UploadResult) => void;
  onError?: (err: Error) => void;
}

/**
 * Mobile-friendly camera capture component.
 * - Uses <input type="file" capture="environment"> to open camera on mobile browsers.
 * - Compresses image via compressImage()
 * - Persists a minimal pending item in localStorage while uploading
 * - Uploads via uploadFile() helper which stores metadata in Firestore + Storage
 */
export default function CameraCapture({
  orgId,
  userId,
  context,
  maxSizeMB = 2,
  onUploaded,
  onError,
}: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleOpenCamera = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const savePending = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const clearPending = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    setProgress(0);

    // Save pending state to localStorage so UI can resume/show later
    const pendingKey = `camera_pending_${Date.now()}`;
    savePending(pendingKey, {
      filename: file.name,
      size: file.size,
      createdAt: Date.now(),
      status: "pending",
      context,
    });

    try {
      // Compress image to target size
      const compressed = await compressImage(file, {
        maxSizeMB,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      // uploadFile expects a File (or Blob) - ensure File
      const fileToUpload =
        compressed instanceof File
          ? compressed
          : new File([compressed], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });

      // uploadFile supports onProgress via options; provide a simple progress handler
      const result = await uploadFile(fileToUpload, orgId, userId, {
        optimize: false, // already compressed
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        context,
        onProgress: (p) => {
          setProgress(p.percentage);
        },
      });

      clearPending(pendingKey);
      setProgress(null);
      setUploading(false);
      if (onUploaded) onUploaded(result);
    } catch (err) {
      setUploading(false);
      setProgress(null);
      // leave pending entry so user can retry/sync later
      if (onError && err instanceof Error) onError(err);
      // eslint-disable-next-line no-console
      console.error("Camera upload failed", err);
    }
  };

  return (
    <div className="camera-capture">
      <button
        type="button"
        onClick={handleOpenCamera}
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 text-white px-4 py-2 text-sm shadow"
        aria-pressed={uploading}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Take Photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading && (
        <div className="mt-2 text-sm text-gray-600">
          Uploading photo{progress ? ` — ${Math.round(progress)}%` : "…"}
        </div>
      )}
    </div>
  );
}
