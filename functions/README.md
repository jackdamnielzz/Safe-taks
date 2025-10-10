# SafeWork Pro - Cloud Functions

This directory contains Firebase Cloud Functions for the SafeWork Pro application.

## Overview

The Cloud Functions provide serverless backend functionality for:
- **Thumbnail Generation**: Automatic image thumbnail creation on upload (150x150, 300x300, 600x600)
- **Future**: Search indexing, scheduled tasks, webhooks

## Prerequisites

- Node.js 18 or higher
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project access (hale-ripsaw-403915)

## Project Structure

```
functions/
├── src/
│   ├── index.ts              # Main entry point - exports all functions
│   ├── thumbnailGenerator.ts # Thumbnail generation function
│   └── indexers/            # Future: Search indexing functions
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Installation

1. Navigate to the functions directory:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Local Development & Testing

### Using Firebase Emulators

The Firebase emulator suite allows you to test functions locally before deployment.

1. **Start the emulators** (from project root):
```bash
firebase emulators:start
```

This will start:
- Functions emulator on port 5001
- Storage emulator on port 9199
- Firestore emulator on port 8080
- Auth emulator on port 9099
- Emulator UI on port 4000

2. **Test thumbnail generation**:
   - Upload an image to the Storage emulator via the UI (http://localhost:4000)
   - Upload to path: `organizations/{orgId}/uploads/{userId}/{uploadId}/image.jpg`
   - The function will automatically generate thumbnails at:
     - `organizations/{orgId}/uploads/{userId}/{uploadId}/thumbnails/150/image.jpg`
     - `organizations/{orgId}/uploads/{userId}/{uploadId}/thumbnails/300/image.jpg`
     - `organizations/{orgId}/uploads/{userId}/{uploadId}/thumbnails/600/image.jpg`

3. **View function logs**:
   - Check the terminal where emulators are running
   - Or visit the Emulator UI: http://localhost:4000

### Build and Watch Mode

For active development with auto-rebuild:
```bash
npm run build:watch
```

## Deployment

### Deploy All Functions

```bash
# From project root
firebase deploy --only functions
```

Or from functions directory:
```bash
npm run deploy
```

### Deploy Specific Function

Deploy only the thumbnail generator:
```bash
npm run deploy:thumbnails
```

Or manually:
```bash
firebase deploy --only functions:generateThumbnails
```

### First-Time Deployment Checklist

Before deploying to production:

1. ✅ Ensure `sharp` is installed in functions/package.json
2. ✅ Build completes without errors: `npm run build`
3. ✅ Test locally with emulators
4. ✅ Firebase project selected: `firebase use hale-ripsaw-403915`
5. ✅ Logged into Firebase: `firebase login`

### Deployment Command

```bash
# 1. Build the functions
cd functions
npm run build

# 2. Deploy from project root
cd ..
firebase deploy --only functions
```

## Function Details

### generateThumbnails

**Trigger**: Storage object finalized (image upload)

**Purpose**: Automatically generates thumbnails at three sizes when images are uploaded.

**Sizes**: 
- 150x150px (profile/list thumbnails)
- 300x300px (card/preview thumbnails)
- 600x600px (detail view thumbnails)

**Input**: Any image file (JPEG, PNG, WebP, TIFF) uploaded to Firebase Storage

**Output**: Three thumbnail files in `<original-directory>/thumbnails/<size>/` subdirectories

**Processing**:
- Maintains aspect ratio (fit inside dimensions)
- Converts to JPEG format
- Quality: 80%
- No enlargement of smaller images
- Skips already-generated thumbnails (prevents recursion)

**Error Handling**:
- Logs errors without stopping
- Cleans up temporary files
- Gracefully handles non-image files

## Monitoring

### View Logs

**Production logs**:
```bash
firebase functions:log
```

**Specific function**:
```bash
firebase functions:log --only generateThumbnails
```

**Follow logs in real-time**:
```bash
firebase functions:log --only generateThumbnails --follow
```

### Cloud Console

Monitor functions in Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select project: hale-ripsaw-403915
3. Navigate to Functions section
4. View metrics, logs, and performance

## Troubleshooting

### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
cd functions
npm run clean
npm install
npm run build
```

### Sharp Installation Issues

**Problem**: `sharp` native binary issues

**Solution**:
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
```

### Function Not Triggering

**Problem**: Thumbnail function doesn't run on upload

**Checks**:
1. Verify function is deployed: `firebase functions:list`
2. Check Storage path doesn't include `/thumbnails/` (prevents recursion)
3. Verify file is an image (JPEG, PNG, WebP, TIFF)
4. Check function logs for errors

### Emulator Issues

**Problem**: Functions emulator won't start

**Solution**:
```bash
# Kill any running emulators
firebase emulators:kill

# Clear emulator data
rm -rf .firebase

# Restart emulators
firebase emulators:start
```

## Performance Considerations

- **Cold Starts**: First invocation may take 1-2 seconds
- **Concurrent Execution**: Function scales automatically
- **Memory**: Default 256MB (sufficient for thumbnails)
- **Timeout**: Default 60s (thumbnail generation takes <5s)

## Cost Optimization

- Thumbnails stored with long cache headers (1 year)
- Function only runs on new uploads (not on thumbnail creation)
- Uses efficient `sharp` library for fast processing
- Automatic cleanup of temporary files

## Future Enhancements

Planned function additions:
- [ ] Algolia search indexing (Task 4.11C)
- [ ] Scheduled cleanup of expired data
- [ ] Webhook handlers for integrations
- [ ] Email notifications via SendGrid
- [ ] Batch TRA export generation

## Support

For issues or questions:
1. Check logs: `firebase functions:log`
2. Review Firebase Console
3. Consult Firebase Functions documentation: https://firebase.google.com/docs/functions
4. Contact project maintainer

---

**Last Updated**: 2025-10-03  
**Maintained By**: SafeWork Pro Development Team