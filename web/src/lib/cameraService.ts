/**
 * Camera Service
 * 
 * Provides camera access and photo capture functionality for LMRA documentation.
 * Follows the same pattern as locationService.ts for consistency.
 * 
 * Features:
 * - Request camera permission
 * - Capture photos from device camera
 * - Support front and rear cameras
 * - Preview captured photos
 * - Handle permission errors gracefully
 * - Fallback to file input for unsupported devices
 */

export interface CameraPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  timestamp: Date;
}

export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export class CameraService {
  private static instance: CameraService;
  private stream: MediaStream | null = null;
  private permissionGranted: boolean = false;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Check if camera API is supported
   */
  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  /**
   * Check camera permission status
   */
  async checkPermission(): Promise<CameraPermissionStatus> {
    if (!this.isSupported()) {
      return { granted: false, denied: true, prompt: false };
    }

    try {
      // Try to query permission status if available
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return {
          granted: result.state === 'granted',
          denied: result.state === 'denied',
          prompt: result.state === 'prompt',
        };
      }
    } catch (error) {
      // Permission API not supported, will need to request access
      console.log('Permission API not supported, will request camera access');
    }

    // If permission API not available, assume prompt state
    return { granted: this.permissionGranted, denied: false, prompt: !this.permissionGranted };
  }

  /**
   * Request camera permission and get stream
   */
  async requestPermission(constraints: CameraConstraints = {}): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Camera API is not supported on this device');
    }

    try {
      // Default to rear camera for documentation
      const videoConstraints: MediaTrackConstraints = {
        facingMode: constraints.facingMode || 'environment',
        width: constraints.width ? { ideal: constraints.width } : { ideal: 1920 },
        height: constraints.height ? { ideal: constraints.height } : { ideal: 1080 },
      };

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      this.permissionGranted = true;
      return this.stream;
    } catch (error) {
      this.permissionGranted = false;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No camera found on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Camera is already in use by another application.');
        } else if (error.name === 'OverconstrainedError') {
          throw new Error('Camera does not support the requested constraints.');
        } else {
          throw new Error(`Camera error: ${error.message}`);
        }
      }
      
      throw new Error('Failed to access camera');
    }
  }

  /**
   * Capture photo from video stream
   */
  async capturePhoto(videoElement: HTMLVideoElement): Promise<CapturedPhoto> {
    if (!videoElement || !videoElement.srcObject) {
      throw new Error('No active video stream');
    }

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Draw current video frame to canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.92 // High quality for documentation
      );
    });

    // Get data URL for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      size: blob.size,
      mimeType: blob.type,
      timestamp: new Date(),
    };
  }

  /**
   * Stop camera stream
   */
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Switch between front and rear camera
   */
  async switchCamera(currentFacingMode: 'user' | 'environment'): Promise<MediaStream> {
    this.stopStream();
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return this.requestPermission({ facingMode: newFacingMode });
  }

  /**
   * Get available camera devices
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate camera devices:', error);
      return [];
    }
  }

  /**
   * Capture photo from file input (fallback for unsupported devices)
   */
  async captureFromFile(file: File): Promise<CapturedPhoto> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image');
    }

    // Read file as data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    // Get image dimensions
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = dataUrl;
    });

    return {
      blob: file,
      dataUrl,
      width: img.width,
      height: img.height,
      size: file.size,
      mimeType: file.type,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();
