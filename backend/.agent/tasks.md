# Passport.js OAuth Migration - Task Breakdown

> **Project:** Bariqe Dashboard Backend  
> **Goal:** Migrate custom Google/Apple OAuth to Passport.js  
> **Status:** 🟡 In Progress  
> **Last Updated:** 2026-01-18

---

## Overview

This document outlines the migration from a custom OAuth implementation (direct token verification) to Passport.js for Google and Apple authentication in the Bariqe Dashboard backend.

### Current State
- Custom `GoogleAuthService` and `AppleAuthService` classes verifying tokens directly
- Token-based flow where frontend sends ID tokens to backend
- No server-side OAuth flow

### Target State  
- Passport.js strategies for Google and Apple OAuth
- Server-side OAuth flow with redirects
- Company domain restriction (`@yourcompany.com`)
- Proper session management

---

## Phase 1: Configuration ⚙️

**Goal:** Set up Passport.js core configuration and environment variables.

### Tasks

- [x] **1.1** Create `config/passport/` directory structure
- [x] **1.2** Create `config/passport/index.ts` - Main Passport configuration
- [x] **1.3** Create `config/passport/types.ts` - TypeScript type definitions
- [ ] **1.4** Add required environment variables to `.env`:
  ```env
  # Google OAuth
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
  
  # Apple OAuth
  APPLE_CLIENT_ID=your_apple_client_id
  APPLE_TEAM_ID=your_apple_team_id
  APPLE_KEY_ID=your_apple_key_id
  APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  APPLE_CALLBACK_URL=http://localhost:8080/api/auth/apple/callback
  
  # Domain Restriction
  ALLOWED_EMAIL_DOMAIN=@yourcompany.com
  
  # Frontend URL
  FRONTEND_URL=http://localhost:3000
  ```
- [ ] **1.5** Install type definitions (if missing):
  ```bash
  npm install --save-dev @types/passport @types/passport-google-oauth20 @types/express-session
  ```

### Verification
- [ ] Environment variables are loaded correctly
- [ ] No TypeScript errors in config files

---

## Phase 2: Strategy Implementation 🛡️

**Goal:** Implement Passport strategies with domain restriction.

### Tasks

- [x] **2.1** Implement Google OAuth 2.0 Strategy
  - Profile data extraction (email, name, picture)
  - Domain validation (`isAllowedEmailDomain`)
  - Find-or-create user logic

- [x] **2.2** Implement Apple OAuth Strategy
  - Handle Apple's unique data format
  - Store user name on first login (Apple only sends once)
  - Domain validation

- [x] **2.3** Implement Domain Restriction
  ```typescript
  const isAllowedEmailDomain = (email: string): boolean => {
    return email.toLowerCase().endsWith(config.allowedDomain.toLowerCase());
  };
  ```

- [x] **2.4** Implement User Serialization/Deserialization
  - `serializeUser`: Store user ID in session
  - `deserializeUser`: Retrieve user from database

### Verification
- [ ] Strategies are registered with `passport.use()`
- [ ] Domain restriction blocks non-company emails
- [ ] Users are created/found correctly

---

## Phase 3: Route Setup 🛤️

**Goal:** Configure OAuth routes with proper callback handling.

### Tasks

- [x] **3.1** Create `routes/auth/index.ts` for OAuth routes.

- [x] **3.2** Implement Google Routes:
  ```
  GET  /api/auth/google          → Initiate OAuth
  GET  /api/auth/google/callback → Handle callback
  ```

- [x] **3.3** Implement Apple Routes (Note: POST callback):
  ```
  GET  /api/auth/apple           → Initiate OAuth
  POST /api/auth/apple/callback  → Handle callback (APPLE USES POST!)
  ```

- [x] **3.4** Implement utility routes:
  ```
  GET /api/auth/logout  → Clear session
  GET /api/auth/status  → Check auth status
  ```

- [ ] **3.5** Register auth router in main `routes/index.ts`:
  ```typescript
  import authRouter from "./auth";
  router.use("/api/auth", authRouter);
  ```

### Apple POST Callback Note ⚠️

Unlike Google which uses GET for callbacks, **Apple Sign In uses POST**. This is critical:

```typescript
// Google: GET request
authRouter.get("/google/callback", passport.authenticate("google", {...}));

// Apple: POST request - REQUIRED BY APPLE!
authRouter.post("/apple/callback", passport.authenticate("apple", {...}));
```

### Verification
- [ ] Routes are accessible
- [ ] Google OAuth flow works end-to-end
- [ ] Apple OAuth flow works with POST callback

---

## Phase 4: Session Management 🔐

**Goal:** Configure Express sessions for Passport.js.

### Tasks

- [ ] **4.1** Update `app.ts` to initialize Passport:
  ```typescript
  import session from "express-session";
  import passport from "./config/passport";
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  ```

- [ ] **4.2** Add `SESSION_SECRET` to environment variables

- [ ] **4.3** Configure session store for production (Optional but recommended):
  ```bash
  npm install connect-mongo
  ```
  ```typescript
  import MongoStore from "connect-mongo";
  
  app.use(session({
    // ...other options
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 30 * 24 * 60 * 60, // 30 days
    }),
  }));
  ```

- [ ] **4.4** Update CORS for credentials if needed (already configured)

### Verification
- [ ] Sessions persist across requests
- [ ] Session data stored in MongoDB (production)
- [ ] Cookies set correctly with proper flags

---

## Phase 5: Migration & Cleanup 🧹

**Goal:** Complete migration and remove legacy code.

### Tasks

- [ ] **5.1** Keep legacy `SocialLogin` method as fallback (temporary)

- [ ] **5.2** Update frontend to use new OAuth redirect flow:
  - Change from: POST `/customer/google` with token
  - Change to: Redirect to `GET /api/auth/google`

- [ ] **5.3** Test both flows work simultaneously during transition

- [ ] **5.4** After validation, mark legacy services as deprecated:
  ```typescript
  // services/social-auth/google.ts
  /** @deprecated Use Passport.js OAuth flow instead */
  ```

- [ ] **5.5** Remove legacy social auth services (after full migration):
  - `services/social-auth/google.ts`
  - `services/social-auth/apple.ts`

- [ ] **5.6** Remove legacy routes from `routes/public/index.ts`:
  ```typescript
  // REMOVE after migration:
  // publicRouter.post("/customer/google", ...)
  // publicRouter.post("/customer/apple", ...)
  ```

- [ ] **5.7** Update documentation

---

## Directory Structure

```
backend/
├── config/
│   ├── db.ts                          # Existing DB config
│   └── passport/                      # NEW: Passport config
│       ├── index.ts                   # Main Passport setup
│       └── types.ts                   # TypeScript definitions
├── routes/
│   ├── index.ts                       # Main router
│   ├── auth/                          # NEW: OAuth routes
│   │   └── index.ts                   # Google/Apple OAuth routes
│   ├── customer/                      # Existing customer routes
│   ├── protected/                     # Existing protected routes
│   └── public/                        # Existing public routes
├── services/
│   └── social-auth/                   # LEGACY: Will be deprecated
│       ├── google.ts                  # @deprecated
│       └── apple.ts                   # @deprecated
├── middlewares/
│   └── authentication.ts              # Existing auth middleware
└── app.ts                             # Express app (update with Passport)
```

---

## Environment Variables Checklist

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | ✅ | Google OAuth Callback URL |
| `APPLE_CLIENT_ID` | ✅ | Apple Service ID |
| `APPLE_TEAM_ID` | ✅ | Apple Developer Team ID |
| `APPLE_KEY_ID` | ✅ | Apple Key ID |
| `APPLE_PRIVATE_KEY` | ✅ | Apple Private Key (PEM format) |
| `APPLE_CALLBACK_URL` | ✅ | Apple OAuth Callback URL |
| `ALLOWED_EMAIL_DOMAIN` | ✅ | Company domain (e.g., @yourcompany.com) |
| `SESSION_SECRET` | ✅ | Express session secret |
| `FRONTEND_URL` | ✅ | Frontend URL for redirects |
| `COOKIE_DOMAIN` | ⚪ | Cookie domain (optional) |

---

## Testing Checklist

### Google OAuth
- [ ] Initiates OAuth flow correctly
- [ ] Receives callback from Google
- [ ] Creates new user on first login
- [ ] Links existing user on subsequent login
- [ ] Rejects non-company domain emails
- [ ] Sets access token cookie
- [ ] Redirects to frontend correctly

### Apple OAuth
- [ ] Initiates OAuth flow correctly
- [ ] Handles POST callback (not GET!)
- [ ] Stores user name on first login
- [ ] Creates new user correctly
- [ ] Rejects non-company domain emails
- [ ] Sets access token cookie
- [ ] Redirects to frontend correctly

### Session Management
- [ ] Sessions persist across requests
- [ ] Cookie has correct flags (httpOnly, secure, sameSite)
- [ ] Session expires correctly
- [ ] Logout clears session and cookie

---

## Notes

### Why Passport.js?

1. **Standardization**: Industry-standard OAuth implementation
2. **Maintainability**: Well-documented, active community
3. **Security**: Battle-tested implementation
4. **Flexibility**: Easy to add more providers (Facebook, Twitter, etc.)

### Apple Sign In Quirks

1. **POST Callback**: Apple uses POST for callbacks, not GET
2. **User Data Once**: Apple only sends user name on first authorization
3. **Private Key**: Requires a private key file/string, not just client secret
4. **Team ID**: Requires Apple Developer Team ID

### Domain Restriction

The `@yourcompany.com` restriction ensures only company employees can log in. Update `ALLOWED_EMAIL_DOMAIN` in production:

```env
ALLOWED_EMAIL_DOMAIN=@bariqealtamyoz.com
```

---

## Related Files

- `config/passport/index.ts` - Passport configuration
- `config/passport/types.ts` - Type definitions  
- `routes/auth/index.ts` - OAuth routes
- `app.ts` - Express app configuration
