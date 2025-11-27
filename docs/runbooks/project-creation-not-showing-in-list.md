# Runbook: Project Creation Not Showing in List

**Status**: 🔴 CRITICAL - Partially Fixed, Requires Production Setup
**Last Updated**: 2025-11-10
**Severity**: High - Blocks core functionality
**Estimated Time**: 2-4 hours

## Problem Description

When users create a new project through any of the entry points (`/projects/create`, `/settings`, or TRA wizard), the project is successfully created in the backend (POST returns 200, project ID is generated), but the project does NOT appear in the projects list at `/projects`.

## Symptoms

1. ✅ User can fill out project creation form
2. ✅ Form submits successfully (POST `/api/projects` returns 200)
3. ✅ Success message is shown
4. ✅ User is redirected to `/projects`
5. ❌ Projects list is empty (shows "No projects found")
6. ❌ Newly created project is not visible

## Root Cause Analysis

### Primary Issue: Development Stub Bug

The application uses a development stub ([`web/src/lib/server-helpers.js`](../web/src/lib/server-helpers.js)) instead of the real Firebase Admin SDK. This stub has a critical bug in the Firestore query implementation:

**Location**: `web/src/lib/server-helpers.js`, lines 345-360

**Expected Firestore QuerySnapshot Structure**:
```javascript
{
  docs: [{ id: 'doc1', data: () => ({...}) }],
  size: 1,
  empty: false
}
```

**Actual Stub Response**:
```javascript
{
  docs: undefined,
  size: undefined,
  empty: undefined
}
```

### Secondary Issues Discovered

1. **Infinite Redirect Loop** (FIXED)
   - Location: [`web/src/app/dashboard/page.tsx`](../web/src/app/dashboard/page.tsx:96)
   - Issue: Dashboard called `router.push('/auth/login')` while middleware redirected back
   - Fix: Removed router.push, let middleware handle redirects

2. **Auth Flow Hanging** (FIXED)
   - Location: [`web/src/app/auth/login/page.tsx`](../web/src/app/auth/login/page.tsx:46)
   - Issue: useEffect waited for both `user` AND `!loading` states
   - Fix: Removed `loading` dependency, redirect immediately when user is available

3. **Dashboard Hanging** (WORKAROUND)
   - Location: [`web/src/app/dashboard/page.tsx`](../web/src/app/dashboard/page.tsx)
   - Issue: Dashboard loads but hangs on data fetching (KPI calculations, LMRA data)
   - Workaround: Changed login redirect to `/projects` instead of `/dashboard`

## Files Modified (Partial Fixes)

### 1. `web/src/lib/server-helpers.js` (Line 345-360)
**Change**: Added `size` and `empty` properties to query response
```javascript
get: async () => {
  try {
    // ... existing code ...
    const docs = Object.entries(colRoot).map(([id, data]) => ({ 
      id, 
      data: () => data,
      exists: true 
    }));
    return { 
      docs, 
      size: docs.length,        // ✅ ADDED
      empty: docs.length === 0  // ✅ ADDED
    };
  } catch (e) {
    return { docs: [], size: 0, empty: true };  // ✅ ADDED
  }
}
```

### 2. `web/src/app/api/projects/route.ts` (Line 173-217)
**Change**: Added fallback logic to access internal store directly
```javascript
// Handle both real Firebase SDK and development stub
let docs: any[] = [];

if (snaps) {
  if (snaps.docs && Array.isArray(snaps.docs)) {
    docs = snaps.docs;
  } else if (typeof snaps === 'object' && snaps.docs === undefined) {
    // Development stub - access internal store directly
    console.log("⚠️ Using fallback: accessing stub internal store");
    const { firestore } = initializeAdmin();
    const internalStore = (firestore as any).__inMemoryStore;
    if (internalStore?.organizations?.[orgId]?.projects) {
      docs = Object.entries(internalStore.organizations[orgId].projects)
        .map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
    }
  }
}
```

### 3. `web/src/app/dashboard/page.tsx` (Line 96)
**Change**: Removed router.push that caused infinite loop
```javascript
// BEFORE (caused infinite loop):
if (!user) {
  router.push('/auth/login');
  return null;
}

// AFTER (let middleware handle it):
if (!user) {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

### 4. `web/src/app/auth/login/page.tsx` (Line 46)
**Change**: Fixed auth flow and changed redirect target
```javascript
// BEFORE:
React.useEffect(() => {
  if (waitingForAuthState && user && !loading) {  // ❌ Waited for !loading
    router.push('/dashboard');  // ❌ Went to hanging dashboard
  }
}, [user, loading, waitingForAuthState, router]);

// AFTER:
React.useEffect(() => {
  if (waitingForAuthState && user) {  // ✅ Only wait for user
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirect') || '/projects';  // ✅ Go to /projects
    
    setTimeout(() => {
      router.push(redirectTo);
    }, 100);
  }
}, [user, waitingForAuthState, router]);  // ✅ Removed loading dependency
```

## Current Status

### ✅ Working
- User authentication and login
- Project creation API (POST `/api/projects`)
- Project data is stored in internal store
- Form validation and submission
- Redirect flow after login

### ❌ Not Working
- Projects list remains empty after creation
- GET `/api/projects` returns empty array
- Fallback code not executing (Next.js caching issue)

### ⚠️ Workarounds Active
- Login redirects to `/projects` instead of `/dashboard`
- Dashboard page bypassed to avoid hanging issue

## Solution Options

### Option 1: Firebase Admin SDK Setup (RECOMMENDED for Production)

**Time**: 2-3 hours
**Difficulty**: Medium
**Production Ready**: ✅ Yes

#### Steps:

1. **Get Firebase Admin Credentials**
   ```bash
   # Go to Firebase Console
   # Project Settings > Service Accounts
   # Generate new private key
   # Download serviceAccountKey.json
   ```

2. **Configure Environment Variables**
   ```bash
   # Add to web/.env.local
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Update `web/src/lib/firebase-admin.ts`**
   ```typescript
   import * as admin from 'firebase-admin';
   
   if (!admin.apps.length) {
     admin.initializeApp({
       credential: admin.credential.cert({
         projectId: process.env.FIREBASE_PROJECT_ID,
         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
       }),
     });
   }
   
   export const firestore = admin.firestore();
   export const auth = admin.auth();
   export const storage = admin.storage();
   ```

4. **Update `web/src/lib/server-helpers.ts`**
   ```typescript
   import { firestore, auth, storage } from './firebase-admin';
   
   export function initializeAdmin() {
     return { firestore, auth, storage };
   }
   ```

5. **Remove Development Stub**
   ```bash
   # Rename or delete
   mv web/src/lib/server-helpers.js web/src/lib/server-helpers.js.backup
   ```

6. **Test**
   ```bash
   cd web
   npm run dev
   # Navigate to http://localhost:3000/projects/create
   # Create a project
   # Verify it appears in the list
   ```

### Option 2: Hard Reset Development Environment

**Time**: 30 minutes
**Difficulty**: Easy
**Production Ready**: ❌ No (still uses stub)

#### Steps:

1. **Stop All Node Processes**
   ```powershell
   taskkill /F /IM node.exe
   ```

2. **Clear All Caches**
   ```powershell
   cd d:/Programmeren/MaasISO/saasapps/tra001/web
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache
   ```

3. **Restart Dev Server**
   ```powershell
   npm run dev
   ```

4. **Verify New Code is Loaded**
   - Navigate to http://localhost:3000/projects
   - Open browser DevTools > Network tab
   - Create a new project
   - Check terminal logs for: `⚠️ Using fallback: accessing stub internal store`
   - If you see this log, the new code is active

5. **Test Project Creation**
   - Create a project
   - Check if it appears in the list
   - If still not working, proceed to Option 1 or 3

### Option 3: Firebase Emulator Setup

**Time**: 1-2 hours
**Difficulty**: Medium
**Production Ready**: ⚠️ Development only

#### Steps:

1. **Install Firebase Tools**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Emulators**
   ```bash
   cd d:/Programmeren/MaasISO/saasapps/tra001
   firebase init emulators
   # Select: Firestore, Authentication, Storage
   ```

3. **Update `firebase.json`**
   ```json
   {
     "emulators": {
       "auth": {
         "port": 9099
       },
       "firestore": {
         "port": 8080
       },
       "storage": {
         "port": 9199
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

4. **Update Environment Variables**
   ```bash
   # Add to web/.env.local
   NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
   NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
   ```

5. **Start Emulators**
   ```bash
   firebase emulators:start
   ```

6. **Update Firebase Config**
   ```typescript
   // web/src/lib/firebase.ts
   if (process.env.NODE_ENV === 'development') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(firestore, 'localhost', 8080);
     connectStorageEmulator(storage, 'localhost', 9199);
   }
   ```

## Verification Steps

After implementing any solution:

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

2. **Test Project Creation**
   ```
   1. Navigate to http://localhost:3000/projects
   2. Click "Nieuw Project" button
   3. Fill in project details:
      - Name: "Test Project"
      - Description: "Test description"
      - Location: "Test location"
   4. Click "Project Aanmaken"
   5. Verify redirect to /projects
   6. Verify project appears in list
   ```

3. **Check Terminal Logs**
   ```
   Expected logs for successful creation:
   📝 POST /api/projects - Request started
   ✅ Auth completed in Xms - User: dev-user, Org: test-org
   ✅ Body parsed in Xms - Project name: "Test Project"
   ✅ Project created in Xms - ID: projects-XXXXXXXXXX
   ✅ POST /api/projects completed in Xms
   
   📋 GET /api/projects - Request started
   ✅ Auth completed in Xms
   ✅ Query completed in Xms - Found 1 documents
   ✅ Processed 1 docs - Active: 1, Deleted: 0
   ✅ GET /api/projects completed in Xms - Returning 1 projects
   ```

4. **Verify in Browser**
   - Projects list shows the new project
   - Project card displays correct name, description
   - No console errors in browser DevTools

## Troubleshooting

### Issue: "Found 0 documents" in logs

**Cause**: Stub not returning documents correctly
**Solution**: Implement Option 1 (Firebase Admin SDK)

### Issue: "Invalid query result structure"

**Cause**: Old cached code still running
**Solution**: 
1. Stop server
2. Delete `.next` directory
3. Restart server
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: "Project created but still not in list"

**Cause**: GET endpoint not reading from correct location
**Solution**: Check internal store structure:
```javascript
// Add temporary debug log in route.ts
console.log("Internal store:", JSON.stringify(internalStore, null, 2));
```

### Issue: "TypeError: snaps.forEach is not a function"

**Cause**: Using wrong method on QuerySnapshot
**Solution**: Use `snaps.docs.forEach()` instead of `snaps.forEach()`

## Related Issues

- Dashboard hanging on load (separate issue)
- Auth cookie expiration (intermittent)
- Firestore permission errors (production only)

## References

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Firestore QuerySnapshot](https://firebase.google.com/docs/reference/js/firestore_.querysnapshot)

## Contact

For questions or issues with this runbook:
- Check [`memory-bank/activeContext.md`](../memory-bank/activeContext.md) for latest status
- Review [`AGENTS.md`](../AGENTS.md) for project-specific rules
- See [`project-docs/HANDOVER-AUTH-FLOW.md`](../project-docs/HANDOVER-AUTH-FLOW.md) for auth flow details