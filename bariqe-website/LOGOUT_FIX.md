# Logout UI Update Issue - Fix Summary

## Problem
After user logout in the Next.js website (bariqe-website), the header still displayed the "Profile" button instead of "Login" button until the user manually refreshed the page. This occurred despite:
- Toast showing "Logged out successfully"  
- localStorage being cleared
- auth-change event being dispatched
- React Query cache being cleared

## Root Causes

1. **Header didn't listen to `auth-change` events** - The logout dispatched the event but no component responded to it
2. **Long cache staleness** - `useProfile` had a 5-minute stale time, causing cached profile data to persist after logout
3. **No explicit profile data clearing** - `queryClient.clear()` isn't as effective as explicitly setting profile data to `undefined`
4. **Missing error handling** - 401 API errors weren't explicitly clearing the cached profile data
5. **Aggressive cache clearing** - `queryClient.clear()` removed all cache, which was overkill

## Solution

### 1. Created `useAuthStateListener` Hook
**File:** `bariqe-website/src/shared/hooks/useAuthStateListener.ts`

A global listener hook that:
- Listens for `auth-change` events from logout
- Immediately sets profile data to `undefined` for instant UI update
- Invalidates profile query for fresh fetch on next request
- Works across the entire app

### 2. Updated `useProfile` Configuration
**File:** `bariqe-website/src/shared/hooks/useProfile.ts`

Changes:
- Reduced `staleTime` from 5 minutes to **1 minute**
- Added `gcTime: 0` to prevent garbage collected data retention
- Changed return type to `UserProfile | undefined` to properly handle undefined state

**Impact:** Profile data becomes stale faster, triggering quicker refetches after logout

### 3. Improved `useLogout` Hook
**File:** `bariqe-website/src/shared/hooks/useAuth.ts`

Changes:
- **Explicitly set profile to undefined** immediately for instant UI update
- **Invalidate profile query** instead of `queryClient.clear()` for surgical cache management
- **Remove specific queries** (addresses, orders, favorites) instead of clear all
- **Dispatch `auth-change` event** for global listeners

**Key improvement:**
```typescript
// ✅ Set profile data to undefined IMMEDIATELY for instant UI update
queryClient.setQueryData(profileKeys.profile, undefined);

// ✅ Invalidate the profile query so future fetches are fresh
queryClient.invalidateQueries({ queryKey: profileKeys.profile });
```

### 4. Enhanced Axios Interceptor
**File:** `bariqe-website/src/lib/publicAxiosInstance.ts`

Added 401 error handling:
- When API returns 401, immediately clear localStorage
- Dispatch `auth-change` event to notify all listeners
- Ensures backend and frontend stay in sync

### 5. Created Global Auth State Listener Wrapper
**File:** `bariqe-website/src/lib/providers/AuthStateListenerWrapper.tsx`

A wrapper component that initializes the auth listener globally, preventing multiple listener instances

### 6. Updated Providers
**File:** `bariqe-website/src/lib/providers/Providers.tsx`

Wrapped children with `AuthStateListenerWrapper` so the listener is active on app startup

## How It Works

### Logout Flow:
1. User clicks logout button → `useLogout` mutation triggered
2. Backend clears auth cookie, frontend clears localStorage
3. `useLogout.onSuccess()` runs:
   - Sets profile to `undefined` → **Header immediately sees no user** ✅
   - Invalidates profile query
   - Dispatches `auth-change` event
4. `useAuthStateListener` (running globally) responds to `auth-change`:
   - Confirms no token exists
   - Sets profile to `undefined` again (redundant safety)
   - Invalidates query
5. Header's `useProfile()` hook sees undefined profile
6. `isAuthenticated = !!userProfile` becomes `false` → **UI updates instantly** ✅

### API Error Handling:
1. If profile fetch gets 401 response:
2. Axios interceptor detects status 401
3. Clears localStorage and dispatches `auth-change`
4. Global listener responds immediately
5. Profile becomes undefined → Header updates → User redirected to login

## Files Modified

```
bariqe-website/
├── src/
│   ├── shared/
│   │   ├── hooks/
│   │   │   ├── useAuthStateListener.ts (NEW)
│   │   │   ├── useProfile.ts (MODIFIED)
│   │   │   └── useAuth.ts (MODIFIED)
│   │   └── components/
│   │       └── Header.tsx (MODIFIED - removed redundant listener)
│   └── lib/
│       ├── publicAxiosInstance.ts (MODIFIED)
│       └── providers/
│           ├── Providers.tsx (MODIFIED)
│           └── AuthStateListenerWrapper.tsx (NEW)
```

## Testing the Fix

To verify the fix works:

1. **Login to the website** - Profile button should appear in header
2. **Navigate to profile page and click logout**
   - Toast: "Logged out successfully" ✅
   - Header immediately changes to show "Login" button (no refresh needed) ✅
   - localStorage cleared ✅
   - Redirected to home page ✅

3. **Try accessing protected routes**
   - Should redirect to login (no stale profile data) ✅

## Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Header update after logout | ~Page refresh | Immediate ✅ |
| Cache stale time | 5 minutes | 1 minute |
| Error handling | No 401 handling | 401 clears auth immediately ✅ |
| Cache management | Brute `clear()` all | Surgical query invalidation ✅ |
| Global listeners | None | Active via provider wrapper ✅ |

## Why This Works

The solution combines **three layers of defense**:

1. **Immediate UI update** - Set profile to `undefined` right away
2. **Event-driven reactivity** - Global listener responds instantly
3. **Query management** - Profile won't be served from cache on next mount
4. **Error resilience** - 401 errors trigger client-side logout automatically

This ensures **zero-delay UI updates** while maintaining reliability and predictability.
