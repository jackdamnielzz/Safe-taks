'use client';

/**
 * PhotoCapture Component
 * 
 * Provides camera access and photo capture functionality for LMRA documentation.
 * Features:
 * - Live camera preview
 * - Capture photo with preview
 * - Retake/confirm workflow
 * - Compression progress
 * - Upload progress
 * - Fallback to file input
 * - Error handling
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Upload, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cameraService, CapturedPhoto } from '@/lib/cameraService';
import { photoStorage, StoredPhoto } from '@/lib/photoStorage';
import { photoUpload, UploadProgress } from '@/lib/photoUpload';
import type { LMRAStepNumber } from '@/lib/types/lmra';

interface PhotoCaptureProps {
  lmraId: string;
  stepNumber: LMRAStepNumber;
  userId: string;
  userName?: string;
  onPhotoAdded?: (photoId: string) => void;
  onClose?: () => void;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

type CaptureState = 'idle' | 'requesting' | 'previewing' | 'captured' | 'compressing' | 'uploading' | 'success' | 'error';

export default function PhotoCapture({
  lmraId,
  stepNumber,
  userId,
  userName,
  onPhotoAdded,
  onClose,
  maxPhotos = 10,
  currentPhotoCount = 0,
}: PhotoCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if camera is supported
  const isCameraSupported = cameraService.isSupported();

  // Request camera permission and start stream
  const startCamera = async () => {
    if (!videoRef.current) return;

    setState('requesting');
    setError(null);

    try {
      const stream = await cameraService.requestPermission({ facingMode });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setState('previewing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setState('error');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    cameraService.stopStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      const photo = await cameraService.capturePhoto(videoRef.current);
      setCapturedPhoto(photo);
      setState('captured');
      stopCamera();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(errorMessage);
      setState('error');
    }
  };

  // Switch between front and rear camera
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    await startCamera();
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCaption('');
    startCamera();
  };

  // Handle file input (fallback)
  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('requesting');
    setError(null);

    try {
      const photo = await cameraService.captureFromFile(file);
      setCapturedPhoto(photo);
      setState('captured');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load image';
      setError(errorMessage);
      setState('error');
    }
  };

  // Confirm and upload photo
  const confirmPhoto = async () => {
    if (!capturedPhoto) return;

    setState('compressing');
    setError(null);

    try {
      // Generate unique ID
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get current location if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Location not available, continue without it
      }

      // Create stored photo
      const storedPhoto: StoredPhoto = {
        id: photoId,
        lmraId,
        stepNumber,
        blob: capturedPhoto.blob,
        dataUrl: capturedPhoto.dataUrl,
        caption: caption.trim() || undefined,
        uploadedBy: userId,
        uploadedAt: new Date(),
        metadata: {
          width: capturedPhoto.width,
          height: capturedPhoto.height,
          size: capturedPhoto.size,
          mimeType: capturedPhoto.mimeType,
          latitude,
          longitude,
        },
        syncStatus: 'pending',
      };

      // Save to IndexedDB
      await photoStorage.savePhoto(storedPhoto);

      // Start upload
      setState('uploading');
      await photoUpload.uploadPhotoWithRetry(storedPhoto, 3, (progress: UploadProgress) => {
        setUploadProgress(progress.progress);
        
        if (progress.state === 'error') {
          setError(progress.error || 'Upload failed');
          setState('error');
        }
      });

      setState('success');
      
      // Notify parent
      if (onPhotoAdded) {
        onPhotoAdded(photoId);
      }

      // Auto-close after success
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save photo';
      setError(errorMessage);
      setState('error');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Check if max photos reached
  const isMaxPhotosReached = currentPhotoCount >= maxPhotos;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">
            {state === 'captured' ? 'Review Photo' : 'Take Photo'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex flex-col items-center justify-center">
        {/* Camera Preview or Captured Photo */}
        {state === 'previewing' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {(state === 'captured' || state === 'compressing' || state === 'uploading' || state === 'success') && capturedPhoto && (
          <div className="w-full h-full flex flex-col">
            <img
              src={capturedPhoto.dataUrl}
              alt="Captured"
              className="flex-1 w-full object-contain bg-black"
            />
            
            {/* Caption Input */}
            {state === 'captured' && (
              <div className="p-4 bg-black/80">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="w-full px-4 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:outline-none focus:border-white/40"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* Idle State */}
        {state === 'idle' && (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white text-lg mb-6">
              {isMaxPhotosReached
                ? `Maximum ${maxPhotos} photos reached`
                : 'Ready to take a photo'}
            </p>
            {!isMaxPhotosReached && (
              <>
                {isCameraSupported ? (
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open Camera
                  </button>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Choose Photo
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Requesting State */}
        {state === 'requesting' && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" />
            <p className="text-white text-lg">Requesting camera access...</p>
          </div>
        )}

        {/* Compressing State */}
        {state === 'compressing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" />
              <p className="text-white text-lg">Compressing image...</p>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {state === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center w-64">
              <Upload className="w-16 h-16 text-white mx-auto mb-4" />
              <p className="text-white text-lg mb-4">Uploading photo...</p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-white text-sm mt-2">{Math.round(uploadProgress)}%</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <p className="text-white text-lg">Photo uploaded successfully!</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Error</p>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setState('idle');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {state === 'previewing' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-8">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Switch camera"
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-white/50 hover:scale-105 transition-transform"
              aria-label="Capture photo"
            />

            {/* Placeholder for symmetry */}
            <div className="w-12 h-12" />
          </div>
        </div>
      )}

      {state === 'captured' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Confirm & Upload
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input (fallback) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
