# Testing Guide: Logout UI Update Fix

## Test Scenario 1: Verify Immediate UI Update on Logout

### Steps:
1. Open the website in a browser
2. Navigate to `/login` page
3. Login with valid credentials
4. Verify **"Profile" button** appears in the header ✅
5. Navigate to `/profile` page
6. Click the **"Logout" button**
7. **Verify immediately** (without page refresh):
   - Toast notification: "Logged out successfully" ✅
   - Header shows **"Login" button** (NOT "Profile") ✅
   - URL changed to home page (`/` or `/en`/`/ar`) ✅
   - localStorage tokens cleared ✅

**Expected Result:** UI updates **instantly** without requiring manual refresh

---

## Test Scenario 2: Protected Route Access After Logout

### Steps:
1. After logging out (from Test Scenario 1)
2. Try accessing `/profile` page directly via URL
3. **Verify:** Redirected to `/login` page immediately ✅

**Expected Result:** No stale profile data served

---

## Test Scenario 3: Auth Error Handling (401 Response)

### Steps:
1. Login to the website
2. Open browser DevTools → Network tab
3. Find the token in localStorage
4. Manually delete the token from localStorage
5. Refresh the page
6. **Verify:** Header shows "Login" button (not "Profile") ✅

**Expected Result:** System detects missing auth and updates UI

---

## Test Scenario 4: Multiple Tabs/Windows Sync

### Steps:
1. Open TWO browser tabs/windows with the website
2. Login in Tab 1 - both tabs should show "Profile" ✅
3. In Tab 1, logout
4. **Verify:** Tab 2 also updates to show "Login" (via `auth-change` event) ✅

**Expected Result:** Auth state syncs across tabs instantly

---

## Test Scenario 5: Page Navigation After Logout

### Steps:
1. Login and navigate to different pages (products, cart, etc.)
2. Logout from anywhere on the site
3. **Verify:** 
   - Any page you were on now shows "Login" button ✅
   - Navigation works correctly ✅

**Expected Result:** Logout works consistently everywhere

---

## Console Verification

### Should see in browser console:

**On Logout:**
```javascript
// Public API Error or similar (if checking the logout endpoint)
// Then:
// auth-change event fired
// Profile set to undefined
```

**No 401 errors on profile attempts** after logout (because token cleared)

---

## Files to Monitor

Watch these files during test for debugging:

1. **useProfile hook** - Check React Query state
   - `staleTime: 1 * 60 * 1000` (1 minute) ✅
   - Returns `UserProfile | undefined` ✅

2. **useLogout hook** - Check logout flow
   - Sets profile to `undefined` immediately ✅
   - Dispatches `auth-change` event ✅

3. **useAuthStateListener** - Check listener response
   - Listens to `auth-change` event ✅
   - Updates profile query ✅

---

## Browser DevTools Checks

### Application → LocalStorage:
- After logout: **no "token" key** ✅
- After logout: **no "user" key** ✅

### Application → Cookies:
- After logout: **no "accessToken" or auth cookies** ✅

### React DevTools (if installed):
- After logout: `useProfile` returns `{data: undefined, ...}` ✅

---

## Common Issues to Watch For

❌ **Problem:** Header still shows "Profile" after logout
- **Check:** useAuthStateListener properly imported in Providers
- **Check:** ProfileKeys query key is correct

❌ **Problem:** Page refresh required to see UI update
- **Check:** queryClient.setQueryData executed before toast message
- **Check:** useProfile.staleTime is 1 minute (not 5)

❌ **Problem:** Getting 401 errors in console
- **Check:** 401 interceptor correctly clearing localStorage
- **Check:** publicAxiosInstance has new error handling

---

## Success Criteria ✅

- [ ] Logout updates header instantly (no refresh needed)
- [ ] All auth tokens are cleared from storage
- [ ] Protected routes redirect to login immediately  
- [ ] Toast shows "Logged out successfully"
- [ ] No 401 errors on subsequent requests
- [ ] Multiple tabs sync auth state
- [ ] All console errors cleared
