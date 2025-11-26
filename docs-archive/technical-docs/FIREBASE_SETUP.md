# Firebase Setup Guide - SafeWork Pro

## Overview

This guide provides comprehensive instructions for setting up and deploying Firebase infrastructure for SafeWork Pro. The project uses an existing Firebase project with the following details:

- **Project Name**: My First Project
- **Project ID**: `hale-ripsaw-403915`
- **Project Number**: 922479846568
- **Environment**: Production (previously used, needs cleanup)

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Access to Firebase Console
- Firebase project credentials (already configured in `.env.local`)

## Project Structure

```
tra001/
├── firestore.rules          # Firestore security rules
├── storage.rules           # Cloud Storage security rules
├── web/
│   ├── .env.local         # Firebase credentials (DO NOT COMMIT!)
│   ├── .env.local.example # Template for credentials
│   └── src/
│       └── lib/
│           └── firebase.ts # Firebase SDK initialization
```

## Step 1: Clean Up Existing Firebase Project

Since you're reusing an existing Firebase project, clean it up first:

### 1.1 Navigate to Firebase Console

Visit: https://console.firebase.google.com/project/hale-ripsaw-403915

### 1.2 Clean Firestore Database

1. Go to **Firestore Database** in left sidebar
2. If database exists:
   - Delete all existing collections
   - OR create new database in a different location (recommended)
3. If no database exists:
   - Click **Create database**
   - Choose production mode
   - Select location: `europe-west1` (Amsterdam region)
   - Click **Enable**

### 1.3 Clean Cloud Storage

1. Go to **Storage** in left sidebar
2. If storage exists:
   - Delete all existing files and folders
3. If no storage bucket exists:
   - Click **Get started**
   - Use default security rules (we'll deploy our custom rules later)
   - Click **Done**

### 1.4 Clean Authentication

1. Go to **Authentication** in left sidebar
2. Click **Get started** if not enabled
3. Enable sign-in methods:
   - **Email/Password**: Enable it
   - **Google**: Enable it (optional, for Task 3.2)
4. Delete any existing test users

## Step 2: Initialize Firebase CLI

### 2.1 Login to Firebase

```bash
firebase login
```

This will open your browser for authentication.

### 2.2 Initialize Firebase in Project

Navigate to the project root directory:

```bash
cd d:/Programmeren/MaasISO/saasapps/tra001
```

Initialize Firebase:

```bash
firebase init
```

Select the following options:

1. **Which Firebase features?**
   - [x] Firestore
   - [x] Storage
   - [ ] Hosting (not needed yet)
   - [ ] Functions (will add later in Task 5)

2. **Select a default Firebase project**
   - Use existing project: `hale-ripsaw-403915`

3. **Firestore Rules**
   - File: `firestore.rules` (already exists)
   - Do NOT overwrite!

4. **Firestore Indexes**
   - File: `firestore.indexes.json` (will be created)

5. **Storage Rules**
   - File: `storage.rules` (already exists)
   - Do NOT overwrite!

This will create:
- `firebase.json` - Firebase configuration
- `.firebaserc` - Project aliases
- `firestore.indexes.json` - Firestore indexes

## Step 3: Deploy Security Rules

### 3.1 Deploy Firestore Rules

Deploy the comprehensive Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔ Deploy complete!
```

### 3.2 Deploy Storage Rules

Deploy the Cloud Storage security rules:

```bash
firebase deploy --only storage
```

Expected output:
```
✔ Deploy complete!
```

### 3.3 Verify Deployment

1. Go to Firebase Console > Firestore Database > Rules
2. Verify rules show the custom multi-tenant security rules
3. Go to Firebase Console > Storage > Rules
4. Verify storage rules are deployed

## Step 4: Configure Firebase SDK

The Firebase SDK is already configured in `web/src/lib/firebase.ts` and reads from environment variables.

### 4.1 Verify Environment Variables

Check that `web/.env.local` contains:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDg7v8DwG7FdBCAJZVACBpdlq6dkxeo_Ow
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hale-ripsaw-403915.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hale-ripsaw-403915
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hale-ripsaw-403915.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=922479846568
NEXT_PUBLIC_FIREBASE_APP_ID=1:922479846568:web:122a3bac5f0267a8ee8e9d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-LT7BVEL9N0
```

### 4.2 Test Firebase Connection

Start the development server:

```bash
cd web
npm run dev
```

Open browser to `http://localhost:3000` and check browser console for errors.

## Step 5: Understanding the Security Architecture

### Multi-Tenant Data Isolation

All data is organized under `organizations/{orgId}`:

```
organizations/
├── {orgId}/
│   ├── users/
│   ├── projects/
│   ├── traTemplates/
│   ├── tras/
│   ├── lmraSessions/
│   ├── hazards/
│   ├── controlMeasures/
│   └── auditLogs/
```

### Role-Based Access Control (RBAC)

Four roles with different permissions:

1. **admin** - Full access to organization data
2. **safety_manager** - Manage TRAs, templates, reports
3. **supervisor** - Create/edit TRAs, conduct LMRAs
4. **field_worker** - View TRAs, participate in LMRAs

### Custom Claims

User authentication tokens include custom claims:

```typescript
{
  uid: "user123",
  email: "user@example.com",
  orgId: "org456",        // Organization ID
  role: "supervisor"      // User role
}
```

These claims are validated by security rules on every request.

## Step 6: Testing Security Rules (Task 2.4)

### 6.1 Manual Testing via Firebase Console

1. Go to Firestore Database
2. Try to create a document in a restricted collection
3. Verify you get permission denied errors

### 6.2 Automated Testing (Optional)

Create test file `test/firestore.test.js`:

```javascript
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

// Test multi-tenant isolation
// Test RBAC permissions
// Test audit log immutability
```

Run tests:

```bash
npm test
```

### 6.3 Integration Testing

After implementing Authentication (Task 3.1):

1. Create test organization
2. Create users with different roles
3. Set custom claims via Firebase Admin SDK
4. Test CRUD operations for each role
5. Verify data isolation between organizations

## Step 7: Firestore Indexes

As you build the app, you may need composite indexes for complex queries.

### 7.1 Automatic Index Creation

When you run a query that needs an index, Firestore will:

1. Show error in console with index creation link
2. Click the link to auto-generate the index
3. Wait a few minutes for index to build

### 7.2 Manual Index Creation

Edit `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tras",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "riskLevel", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

## Troubleshooting

### Error: Permission Denied

**Cause**: User doesn't have required custom claims (orgId, role)

**Solution**: 
1. Ensure user is authenticated
2. Set custom claims using Firebase Admin SDK (Task 3.1)
3. Force token refresh in client

### Error: CORS Issues

**Cause**: Firebase Authentication domain not configured

**Solution**:
1. Go to Firebase Console > Authentication > Settings
2. Add authorized domains: `localhost`, your production domain

### Error: Storage Upload Fails

**Cause**: Storage bucket not initialized

**Solution**:
1. Go to Firebase Console > Storage
2. Click **Get started**
3. Deploy storage rules again

### Error: Firestore Rules Not Applied

**Cause**: Rules deployment failed or not refreshed

**Solution**:
1. Redeploy rules: `firebase deploy --only firestore:rules`
2. Clear browser cache
3. Wait 1-2 minutes for propagation

## Security Best Practices

1. **Never Commit `.env.local`**
   - Already in `.gitignore`
   - Use `.env.local.example` as template

2. **Rotate API Keys Regularly**
   - Firebase Console > Project Settings > Service Accounts
   - Generate new web API key if compromised

3. **Use Custom Claims for Authorization**
   - Never trust client-side role checks
   - Always validate with security rules

4. **Monitor Security Rules Usage**
   - Firebase Console > Firestore > Rules > Metrics
   - Check for denied requests

5. **Enable App Check (Later)**
   - Protects against abuse
   - Add in Task 6 (Security hardening)

## Next Steps

After completing this setup:

1. ✅ **Task 2.3**: Firebase project setup (COMPLETE)
2. ⏭️ **Task 2.4**: Deploy and test security rules
3. ⏭️ **Task 3.1**: Implement Authentication with custom claims
4. ⏭️ **Task 3.2**: Implement Google SSO
5. ⏭️ **Task 3.3**: Set up Firebase Admin SDK for custom claims

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security/start)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)

---

**Project**: SafeWork Pro  
**Document Version**: 1.0  
**Last Updated**: 2025-09-29  
**Author**: Code Mode