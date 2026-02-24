/**
 * ============================================================================
 * PASSPORT TYPE DEFINITIONS
 * ============================================================================
 * 
 * TypeScript type definitions for Passport.js OAuth integration.
 */

import { Document } from "mongoose";

// ============================================================================
// EXPRESS SESSION AUGMENTATION
// ============================================================================

declare global {
  namespace Express {
    interface User {
      id?: string;
      _id?: string;
      customerEmail?: string;
      customerName?: string;
      authProvider?: string;
      isVerified?: boolean;
    }
  }
}

// ============================================================================
// OAUTH PROFILE TYPES
// ============================================================================

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "apple";
}

export interface GoogleOAuthProfile extends OAuthProfile {
  provider: "google";
  accessToken?: string;
  refreshToken?: string;
}

export interface AppleOAuthProfile extends OAuthProfile {
  provider: "apple";
  firstName?: string;
  lastName?: string;
}

// ============================================================================
// CUSTOMER DOCUMENT TYPE
// ============================================================================

export interface CustomerDocument extends Document {
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  password?: string;
  authProvider: "local" | "google" | "apple";
  socialId?: string;
  isVerified: boolean;
  avatar?: string;
  otp?: string;
  otpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
}

// ============================================================================
// STRATEGY CONFIGURATION TYPES
// ============================================================================

export interface GoogleStrategyConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

export interface AppleStrategyConfig {
  clientID: string;
  teamID: string;
  keyID: string;
  privateKeyString: string;
  callbackURL: string;
  scope?: string[];
}

// ============================================================================
// AUTH RESPONSE TYPES
// ============================================================================

export interface AuthSuccessResponse {
  success: true;
  token: string;
  customer: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider: string;
  };
}

export interface AuthErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;
