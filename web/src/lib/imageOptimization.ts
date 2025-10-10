/**
 * Image Optimization Utilities
 *
 * Client-side image compression and optimization before upload.
 * Uses browser Canvas API for resizing and compression.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  maxSizeMB?: number; // Maximum file size in MB
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  dimensions: ImageDimensions;
  compressionRatio: number;
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  let width = originalWidth;
  let height = originalHeight;

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Resize based on max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Optimize/compress an image file
 */
export async function optimizeImage(
  file: File,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8, maxSizeMB = 5 } = options;

  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    throw new Error("File is not an image");
  }

  // Get original dimensions
  const originalDimensions = await getImageDimensions(file);
  const originalSize = file.size;

  // If image is already small enough, return as-is
  if (
    originalDimensions.width <= maxWidth &&
    originalDimensions.height <= maxHeight &&
    originalSize <= maxSizeMB * 1024 * 1024
  ) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      dimensions: originalDimensions,
      compressionRatio: 1,
    };
  }

  // Calculate new dimensions
  const newDimensions = calculateNewDimensions(
    originalDimensions.width,
    originalDimensions.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and resize image
  const canvas = document.createElement("canvas");
  canvas.width = newDimensions.width;
  canvas.height = newDimensions.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Load and draw image
  const img = await createImageBitmap(file);
  ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

  // Convert to blob with compression
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      file.type,
      quality
    );
  });

  // Create new File from blob
  const optimizedFile = new File([blob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize: optimizedFile.size,
    dimensions: newDimensions,
    compressionRatio: originalSize / optimizedFile.size,
  };
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ["image/*"] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  const isAllowed = allowedTypes.some((allowedType) => {
    if (allowedType.endsWith("/*")) {
      const prefix = allowedType.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === allowedType;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
