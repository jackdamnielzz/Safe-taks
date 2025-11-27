# Authentication Redirect Behavior - Troubleshooting Guide

## Overview
This document explains the expected authentication redirect behavior and how to properly test the landing page vs. dashboard flow.

## Current Implementation

### Root Page Logic ([`web/src/app/page.tsx`](web/src/app/page.tsx:12-17))
```typescript
useEffect(() => {
  // Redirect to landing page if not logged in
  if (!loading && !user) {
    router.push("/landing");
  }
}, [user, loading, router]);
```

**This logic is correct and working as designed.**

### How Firebase Auth Session Persistence Works

Firebase Auth automatically persists authenticated sessions across:
1. **localStorage** - Stores auth tokens
2. **sessionStorage** - Temporary session data
3. **IndexedDB** - Firestore cache and auth data
4. **Cookies** - Firebase auth cookies

When you visit the site:
1. Firebase checks for cached authentication
2. If valid tokens exist, Firebase restores the session
3. `onAuthStateChanged` fires with the authenticated user
4. `user` is NOT null → Dashboard is shown ✅
5. Redirect to `/landing` does NOT happen (correct behavior)

## Why You're Seeing the Dashboard

**You ARE logged in** - Firebase has a valid cached session. This is CORRECT behavior.

The flow is:
- Visit `http://localhost:3000/`
- Firebase detects cached auth tokens
- Session is restored automatically
- `user` exists → Show dashboard
- ✅ **Working as designed**

## How to Test the Landing Page

### Option 1: Use Incognito/Private Window (Recommended)
```
Chrome: Ctrl+Shift+N
Firefox: Ctrl+Shift+P
Edge: Ctrl+Shift+N
```

✅ **Best for testing** - No cached data, clean slate

### Option 2: Clear Browser Storage
1. Open DevTools (F12)
2. Go to "Application" tab
3. Clear:
   - Local Storage (all `firebase:*` entries)
   - Session Storage
   - IndexedDB databases
   - Cookies
4. Reload page

### Option 3: Use the Logout Button (Proper Way)
1. Click "Uitloggen" in the navigation
2. Calls [`signOutUser()`](web/src/components/AuthProvider.tsx:388) which:
   - Clears user state
   - Signs out from Firebase
   - **Removes ALL Firebase persistence data**
   - Clears localStorage, sessionStorage, cookies, IndexedDB

## Verifying Logout Functionality

### Current Logout Implementation
Location: [`web/src/components/AuthProvider.tsx`](web/src/components/AuthProvider.tsx:388-482)

```typescript
const signOutUser = async (): Promise<void> => {
  // 1. Set logout flag to prevent race conditions
  setIsLoggingOut(true);
  
  // 2. Clear state immediately
  setUser(null);
  setUserProfile(null);
  
  // 3. Firebase signOut
  await signOut(auth);
  
  // 4. Clear ALL persistence:
  //    - localStorage (all firebase:* keys)
  //    - sessionStorage (all firebase:* keys)
  //    - Cookies (firebase auth cookies)
  //    - IndexedDB (firebaseLocalStorageDb, firestore, firebase-installations-database)
}
```

This implementation is **comprehensive and correct**.

## Expected User Flow

### First Visit (No Session)
1. User visits `/`
2. No cached auth → `user` is null
3. Redirect to `/landing` ✅
4. User sees marketing/landing page

### After Login
1. User logs in
2. Firebase creates session
3. Session persists in browser
4. Next visit: Session restored → Show dashboard ✅

### After Logout
1. User clicks "Uitloggen"
2. `signOutUser()` clears ALL Firebase data
3. Next visit: No session → Redirect to `/landing` ✅

## For Developers: Testing Auth Flows

### Test Logged-Out State
```bash
# Use incognito window
npm run dev
# Navigate to: http://localhost:3000/
# Expected: Redirects to /landing
```

### Test Logged-In State
```bash
# Normal browser window
npm run dev
# 1. Login first
# 2. Navigate to: http://localhost:3000/
# Expected: Shows dashboard (session restored)
```

### Test Logout
```bash
# Normal browser window with active session
# 1. Click "Uitloggen" button
# 2. Navigate to: http://localhost:3000/
# Expected: Redirects to /landing
```

## Troubleshooting

### "I see dashboard but I shouldn't be logged in"
**You ARE logged in.** Firebase restored your session.

**Solution**: 
- Use logout button, OR
- Test in incognito mode, OR
- Clear browser storage

### "Logout doesn't work"
**Check**:
1. Console logs - look for 🔓 SignOutUser messages
2. Verify `signOutUser()` is being called
3. Check for JavaScript errors
4. Verify you're navigating to `/landing` after logout

### "I want to test landing page but keep seeing dashboard"
**Use incognito mode** - This is the intended way to test without cached auth.

## Production Considerations

### User Experience Notes
1. **Session persistence is a FEATURE** - Users don't want to re-login every visit
2. **Mobile apps especially** - Users expect to stay logged in
3. **Logout is explicit** - Users must click logout to end session

### Security Notes
- Sessions expire naturally after Firebase token expiration
- Server-side validation should ALWAYS verify tokens
- Client-side auth is for UX only, not security

## Summary

✅ **Redirect logic is working correctly**
✅ **Firebase session persistence is expected behavior**
✅ **Logout functionality is comprehensive**

**For Testing Landing Page**: Use incognito mode
**For Users**: Logout button properly clears all session data