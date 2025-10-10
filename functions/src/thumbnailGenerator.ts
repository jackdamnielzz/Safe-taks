import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
// Use require for sharp to avoid native binary/typing issues during build in some environments
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const sharp = require('sharp') as typeof import('sharp');
import { tmpdir } from 'os';
import { join, dirname, basename } from 'path';
import { promises as fs } from 'fs';

admin.initializeApp();

const storage = getStorage();

const THUMB_SIZES = [150, 300, 600]; // pixels

/**
 * Cloud Function: generateThumbnails
 * Trigger: storage.object.finalize (via onObjectFinalized)
 * Behavior:
 *  - When an image is uploaded, generate thumbnails at configured sizes
 *  - Upload thumbnails next to original under: <originalDir>/thumbnails/<size>/<filename>
 * Notes:
 *  - This is a scaffold intended for emulator testing and production deploy.
 *  - Ensure `sharp` is installed in functions and native binaries are available in the target environment.
 */
export const generateThumbnails = onObjectFinalized(async (event) => {
  // v2 event payload places object metadata on event.data
  const data = (event as any).data || {};
  const bucketName: string | undefined = data.bucket;
  const objectName: string | undefined = data.name;

  if (!bucketName || !objectName) {
    console.warn('[thumbnailGenerator] Missing bucket or object name in event, skipping');
    return;
  }

  // Skip thumbnails folder to avoid recursion
  if (objectName.includes('/thumbnails/')) {
    console.log('[thumbnailGenerator] Object is a thumbnail already, skipping:', objectName);
    return;
  }

  // Only process images (basic check)
  if (!/\.(jpe?g|png|webp|tiff)$/i.test(objectName)) {
    console.log('[thumbnailGenerator] Not an image, skipping:', objectName);
    return;
  }

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);

  // Download original to temp
  const tempFilePath = join(tmpdir(), basename(objectName));
  try {
    await file.download({ destination: tempFilePath });
  } catch (err: any) {
    console.error('[thumbnailGenerator] Failed to download file:', objectName, err);
    return;
  }

  const dir = dirname(objectName);
  const base = basename(objectName);
  const uploads: Promise<void>[] = [];

  for (const size of THUMB_SIZES) {
    const thumbLocalPath = join(tmpdir(), `thumb_${size}_${base}`);
    const thumbRemotePath = join(dir, 'thumbnails', `${size}`, base);

    const p = sharp(tempFilePath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .toFormat('jpeg', { quality: 80 })
      .toFile(thumbLocalPath)
      .then(async () => {
        try {
          await bucket.upload(thumbLocalPath, {
            destination: thumbRemotePath,
            metadata: {
              contentType: 'image/jpeg',
              cacheControl: 'public, max-age=31536000',
            },
          });
          console.log('[thumbnailGenerator] Uploaded thumbnail:', thumbRemotePath);
        } catch (uploadErr: any) {
          console.error('[thumbnailGenerator] Upload failed for', thumbRemotePath, uploadErr);
        } finally {
          // cleanup local thumb
          await fs.unlink(thumbLocalPath).catch(() => {});
        }
      })
      .catch(async (err: any) => {
        console.error('[thumbnailGenerator] Sharp processing failed for size', size, err);
        await fs.unlink(thumbLocalPath).catch(() => {});
      });

    uploads.push(p);
  }

  await Promise.all(uploads);

  // cleanup original
  await fs.unlink(tempFilePath).catch(() => {});
  console.log('[thumbnailGenerator] Completed thumbnails for', objectName);
});