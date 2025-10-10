import imageCompression from "browser-image-compression";

/**
 * Compress an image file for upload.
 * - Targets ~40-60% reduction depending on input and options.
 * - Returns a File ready for upload (type preserved as image/jpeg by default).
 *
 * Usage:
 * const compressed = await compressImage(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
  }
): Promise<File | Blob> {
  const defaultOptions = {
    maxSizeMB: 1, // target ~1MB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/jpeg",
  };

  const opts = { ...defaultOptions, ...options };

  try {
    const compressed = await imageCompression(file, opts as any);
    // Ensure result is a File when possible (preserve original filename)
    if (compressed instanceof Blob) {
      try {
        return new File([compressed], file.name.replace(/\.[^/.]+$/, ".jpg"), {
          type: opts.fileType,
        });
      } catch {
        // Fallback: return Blob if File constructor not available
        return compressed;
      }
    }
    return compressed;
  } catch (err) {
    // On failure, return original file to avoid blocking uploads
    // eslint-disable-next-line no-console
    console.warn("[imageCompression] compression failed, uploading original", err);
    return file;
  }
}
