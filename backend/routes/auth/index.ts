/**
 * ============================================================================
 * PASSPORT OAUTH ROUTES
 * ============================================================================
 * 
 * Routes for Google and Apple OAuth authentication using Passport.js.
 * Note: Apple uses POST for callbacks, which is handled explicitly.
 * 
 * @route /api/auth/google      - Initiate Google OAuth
 * @route /api/auth/google/callback - Google OAuth callback
 * @route /api/auth/apple       - Initiate Apple OAuth  
 * @route /api/auth/apple/callback  - Apple OAuth callback (POST)
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "../../config/passport";
import { sign } from "jsonwebtoken";
import { COOKIE_OPTIONS } from "../../controllers/auth";

const authRouter = Router();

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_CUSTOMER = process.env.JWT_CUSTOMER || "customer_secret_key_fallback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate JWT token for authenticated customer
 * Uses same payload structure as local login
 */
const generateCustomerToken = (customer: any): string => {
  return sign(
    {
      id: customer._id || customer.id,
      email: customer.customerEmail,
      name: customer.customerName,
    },
    JWT_CUSTOMER,
    { expiresIn: "30d" }
  );
};

/**
 * Handle successful OAuth authentication
 * Sets accessToken cookie exactly like local login
 */
const handleOAuthSuccess = (req: Request, res: Response) => {
  const customer = req.user as any;
  
  if (!customer) {
    return res.redirect(`${FRONTEND_URL}/login?error=authentication_failed`);
  }

  const token = generateCustomerToken(customer);

  // Set accessToken cookie using same COOKIE_OPTIONS as local login
  res.cookie("accessToken", token, { ...COOKIE_OPTIONS, httpOnly: true });

  // Redirect to frontend
  res.redirect(`${FRONTEND_URL}`);
};

/**
 * Handle OAuth authentication errors
 */
const handleOAuthError = (error: Error, req: Request, res: Response) => {
  console.error("[OAuth Error]", error.message);
  
  const errorMessage = encodeURIComponent(error.message || "Authentication failed");
  res.redirect(`${FRONTEND_URL}/login?error=${errorMessage}`);
};

// ============================================================================
// GOOGLE OAUTH ROUTES
// ============================================================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // Always show account selector
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public (redirected from Google)
 */
authRouter.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", (err: Error | null, user: any, info: any) => {
      if (err) {
        return handleOAuthError(err, req, res);
      }
      
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return handleOAuthError(loginErr, req, res);
        }
        return handleOAuthSuccess(req, res);
      });
    })(req, res, next);
  }
);

// ============================================================================
// APPLE OAUTH ROUTES
// ============================================================================

/**
 * @route   GET /api/auth/apple
 * @desc    Initiate Apple OAuth flow
 * @access  Public
 */
authRouter.get(
  "/apple",
  passport.authenticate("apple", {
    scope: ["name", "email"],
  })
);

/**
 * @route   POST /api/auth/apple/callback
 * @desc    Apple OAuth callback handler
 * @access  Public (redirected from Apple)
 * 
 * NOTE: Apple uses POST for callbacks, not GET!
 * This is a unique requirement of Apple Sign In.
 */
authRouter.post(
  "/apple/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("apple", (err: Error | null, user: any, info: any) => {
      if (err) {
        return handleOAuthError(err, req, res);
      }
      
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return handleOAuthError(loginErr, req, res);
        }
        return handleOAuthSuccess(req, res);
      });
    })(req, res, next);
  }
);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user and clear session
 * @access  Private
 */
authRouter.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error("[Logout Error]", err);
    }
  });
  
  res.clearCookie("accessToken", COOKIE_OPTIONS as any);

  res.redirect(`${FRONTEND_URL}/login`);
});

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
authRouter.get("/status", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    res.json({
      authenticated: true,
      user: {
        id: user._id || user.id,
        email: user.customerEmail,
        name: user.customerName,
        provider: user.authProvider,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

/**
 * @route   POST /api/auth/set-token
 * @desc    Set accessToken cookie from token received via OAuth redirect
 * @access  Public (but requires valid token)
 * 
 * This endpoint solves the cross-origin cookie issue in OAuth:
 * 1. OAuth redirects to frontend with token in URL
 * 2. Frontend calls this endpoint with the token
 * 3. Backend validates token and sets httpOnly cookie
 */
authRouter.post("/set-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    // Verify the token is valid
    const { verify } = require("jsonwebtoken");
    let decoded;
    try {
      decoded = verify(token, JWT_CUSTOMER);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Set the cookie using same COOKIE_OPTIONS as local login
    res.cookie("accessToken", token, { ...COOKIE_OPTIONS, httpOnly: true });

    res.json({ 
      success: true, 
      message: "Token set successfully",
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    });
  } catch (error) {
    console.error("[Set Token Error]", error);
    res.status(500).json({ success: false, message: "Failed to set token" });
  }
});

export default authRouter;
