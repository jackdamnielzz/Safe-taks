"use client";

/**
 * FileUploader Component
 *
 * Client-side file upload component with:
 * - Drag-and-drop support
 * - Image optimization before upload
 * - Progress tracking
 * - Error handling
 * - Metadata storage in Firestore
 */

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { uploadFile } from "@/lib/uploadHelpers";
import { validateFile, formatFileSize, optimizeImage } from "@/lib/imageOptimization";
import type { UploadProgress, UploadResult, UploadMetadata } from "@/lib/types/upload";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export interface FileUploaderProps {
  /**
   * Organization ID for upload scoping
   */
  orgId: string;

  /**
   * Optional context for the upload (e.g., 'tra', 'lmra', 'profile')
   */
  context?: UploadMetadata["context"];

  /**
   * Maximum file size in MB
   */
  maxSizeMB?: number;

  /**
   * Allowed file types (e.g., ['image/*', 'application/pdf'])
   */
  allowedTypes?: string[];

  /**
   * Enable image optimization
   */
  optimizeImages?: boolean;

  /**
   * Maximum image dimensions for optimization
   */
  maxWidth?: number;
  maxHeight?: number;

  /**
   * Image quality for compression (0-1)
   */
  quality?: number;

  /**
   * Allow multiple file uploads
   */
  multiple?: boolean;

  /**
   * Callback when upload completes
   */
  onUploadComplete?: (result: UploadResult) => void;

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: Error) => void;

  /**
   * Custom button text
   */
  buttonText?: string;

  /**
   * Show upload progress
   */
  showProgress?: boolean;
}

export function FileUploader({
  orgId,
  context,
  maxSizeMB = 10,
  allowedTypes = ["image/*"],
  optimizeImages = true,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8,
  multiple = false,
  onUploadComplete,
  onUploadError,
  buttonText = "Bestand uploaden",
  showProgress = true,
}: FileUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0]; // Handle first file for now

      // Validate file
      const validation = validateFile(file, { maxSizeMB, allowedTypes });
      if (!validation.valid) {
        setError(validation.error || "Ongeldig bestand");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccess(null);
    },
    [maxSizeMB, allowedTypes]
  );

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !user) {
      setError("Geen bestand geselecteerd of gebruiker niet ingelogd");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(null);

    try {
      const result = await uploadFile(selectedFile, orgId, user.uid, {
        optimize: optimizeImages,
        maxWidth,
        maxHeight,
        quality,
        context,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setSuccess(`Bestand succesvol geüpload: ${selectedFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload mislukt";
      setError(errorMessage);

      if (onUploadError && err instanceof Error) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [
    selectedFile,
    user,
    orgId,
    optimizeImages,
    maxWidth,
    maxHeight,
    quality,
    context,
    onUploadComplete,
    onUploadError,
  ]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes.join(",")}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="text-sm text-gray-600">
            <span className="font-semibold text-orange-600 hover:text-orange-500">
              Klik om een bestand te selecteren
            </span>{" "}
            of sleep het hier naartoe
          </div>

          <p className="text-xs text-gray-500">
            {allowedTypes.includes("image/*") && "Afbeeldingen "}
            tot {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Selected file info */}
      {selectedFile && !uploading && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="ml-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && showProgress && progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Uploaden...</span>
            <span className="text-gray-900 font-medium">{Math.round(progress.percentage)}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 text-center">
            {formatFileSize(progress.bytesTransferred)} van {formatFileSize(progress.totalBytes)}
          </p>
        </div>
      )}

      {/* Loading spinner */}
      {uploading && !showProgress && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="error" title="Upload fout" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert variant="success" title="Succesvol geüpload" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
    </div>
  );
}
