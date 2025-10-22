/**
 * Cloud Functions for SafeWork Pro
 * 
 * This file exports all Cloud Functions for the application.
 * Functions are organized by feature/domain in separate files.
 */

// Export thumbnail generation function
export { generateThumbnails } from './thumbnailGenerator';

// Export backup service functions
export {
  scheduledBackup,
  createBackupOnDemand,
  listBackups,
  restoreFromBackup
} from './backupService';

// Future exports can be added here:
// export { trasToAlgolia } from './indexers/tras-to-algolia';
