'use client';

/**
 * PhotoGallery Component
 * 
 * Displays and manages photos for an LMRA.
 * Features:
 * - Grid view of photos
 * - Thumbnail display
 * - Full-size preview
 * - Delete functionality
 * - Upload status indicators
 * - Retry failed uploads
 * - Group by step
 */

import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Eye, Upload, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import { photoStorage, StoredPhoto } from '@/lib/photoStorage';
import { photoUpload } from '@/lib/photoUpload';
import type { LMRAStepNumber } from '@/lib/types/lmra';

interface PhotoGalleryProps {
  lmraId: string;
  stepNumber?: LMRAStepNumber;
  onAddPhoto?: () => void;
  maxPhotos?: number;
  readOnly?: boolean;
}

export default function PhotoGallery({
  lmraId,
  stepNumber,
  onAddPhoto,
  maxPhotos = 10,
  readOnly = false,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Load photos
  const loadPhotos = async () => {
    try {
      setLoading(true);
      let loadedPhotos: StoredPhoto[];
      
      if (stepNumber !== undefined) {
        loadedPhotos = await photoStorage.getPhotosByStep(lmraId, stepNumber);
      } else {
        loadedPhotos = await photoStorage.getPhotosByLmra(lmraId);
      }
      
      // Sort by upload date (newest first)
      loadedPhotos.sort((a, b) => {
        const dateA = a.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0;
        const dateB = b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0;
        return dateB - dateA;
      });
      
      setPhotos(loadedPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete photo
  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      await photoStorage.deletePhoto(photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
      
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Retry failed upload
  const retryUpload = async (photo: StoredPhoto) => {
    try {
      await photoUpload.uploadPhotoWithRetry(photo);
      await loadPhotos(); // Reload to get updated status
    } catch (error) {
      console.error('Failed to retry upload:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  // Load photos on mount and when dependencies change
  useEffect(() => {
    loadPhotos();
  }, [lmraId, stepNumber]);

  // Get sync status badge
  const getSyncStatusBadge = (photo: StoredPhoto) => {
    switch (photo.syncStatus) {
      case 'synced':
        return (
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Check className="w-3 h-3" />
            Synced
          </div>
        );
      case 'syncing':
        return (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Upload className="w-3 h-3 animate-pulse" />
            {photo.uploadProgress ? `${Math.round(photo.uploadProgress)}%` : 'Uploading'}
          </div>
        );
      case 'sync_failed':
        return (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </div>
        );
      case 'pending':
      case 'pending_sync':
        return (
          <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Upload className="w-3 h-3" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Photos {stepNumber && `(Step ${stepNumber})`}
          </h3>
          <p className="text-sm text-gray-600">
            {photos.length} of {maxPhotos} photos
          </p>
        </div>
        
        {!readOnly && canAddMore && onAddPhoto && (
          <button
            onClick={onAddPhoto}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Add Photo
          </button>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No photos yet</p>
          {!readOnly && onAddPhoto && (
            <button
              onClick={onAddPhoto}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first photo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* Photo Thumbnail */}
              <img
                src={photo.thumbnailUrl || photo.dataUrl}
                alt={photo.caption || 'LMRA Photo'}
                className="w-full h-full object-cover"
              />

              {/* Sync Status Badge */}
              {getSyncStatusBadge(photo)}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="View photo"
                >
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>
                
                {!readOnly && (
                  <>
                    {photo.syncStatus === 'sync_failed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryUpload(photo);
                        }}
                        className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                        aria-label="Retry upload"
                      >
                        <RefreshCw className="w-5 h-5 text-white" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      disabled={deletingPhotoId === photo.id}
                      className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}
              </div>

              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-Size Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Photo */}
            <img
              src={selectedPhoto.firebaseUrl || selectedPhoto.dataUrl}
              alt={selectedPhoto.caption || 'LMRA Photo'}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Photo Info */}
            <div
              className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedPhoto.caption && (
                <p className="text-lg mb-2">{selectedPhoto.caption}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-300">Uploaded</p>
                  <p>
                    {selectedPhoto.uploadedAt instanceof Date
                      ? selectedPhoto.uploadedAt.toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-300">Size</p>
                  <p>
                    {selectedPhoto.metadata.width} × {selectedPhoto.metadata.height}
                    {' '}
                    ({Math.round(selectedPhoto.metadata.size / 1024)} KB)
                  </p>
                </div>
                
                {selectedPhoto.metadata.latitude && selectedPhoto.metadata.longitude && (
                  <div className="col-span-2">
                    <p className="text-gray-300">Location</p>
                    <p>
                      {selectedPhoto.metadata.latitude.toFixed(6)}, {selectedPhoto.metadata.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                
                <div className="col-span-2">
                  <p className="text-gray-300">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPhoto.syncStatus === 'synced' && (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Synced to cloud</span>
                      </>
                    )}
                    {selectedPhoto.syncStatus === 'syncing' && (
                      <>
                        <Upload className="w-4 h-4 text-blue-400 animate-pulse" />
                        <span>Uploading... {selectedPhoto.uploadProgress ? `${Math.round(selectedPhoto.uploadProgress)}%` : ''}</span>
                      </>
                    )}
                    {selectedPhoto.syncStatus === 'sync_failed' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>Upload failed: {selectedPhoto.syncError}</span>
                        {!readOnly && (
                          <button
                            onClick={() => retryUpload(selectedPhoto)}
                            className="ml-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Retry
                          </button>
                        )}
                      </>
                    )}
                    {(selectedPhoto.syncStatus === 'pending' || selectedPhoto.syncStatus === 'pending_sync') && (
                      <>
                        <Upload className="w-4 h-4 text-yellow-400" />
                        <span>Pending upload</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      deletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
