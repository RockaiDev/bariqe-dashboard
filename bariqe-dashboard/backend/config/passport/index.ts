/**
 * ============================================================================
 * PASSPORT.JS CONFIGURATION
 * ============================================================================
 * 
 * Main Passport.js configuration file for OAuth strategies.
 * Handles Google and Apple OAuth with company domain restriction.
 * 
 * @author Bariqe Team
 * @version 1.0.0
 */

import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import customers from "../../models/customerSchema";

// passport-apple doesn't have proper TS types, so we use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppleStrategy = require("passport-apple");

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "apple";
}

interface PassportConfig {
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  apple: {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyString: string;
    callbackURL: string;
  };
 
}

interface AppleDecodedIdToken {
  sub: string;
  email?: string;
  email_verified?: boolean;
  aud?: string;
  iss?: string;
}

interface AppleProfile {
  id?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  email?: string;
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const config: PassportConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID || "",
    teamID: process.env.APPLE_TEAM_ID || "",
    keyID: process.env.APPLE_KEY_ID || "",
    privateKeyString: process.env.APPLE_PRIVATE_KEY || "",
    callbackURL: process.env.APPLE_CALLBACK_URL || "/api/auth/apple/callback",
  }
};


// ============================================================================
// USER SERIALIZATION
// ============================================================================

/**
 * Serialize user for session storage.
 * Only stores the user ID to minimize session data.
 */
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as any)._id || (user as any).id);
});

/**
 * Deserialize user from session.
 * Retrieves full user data from database.
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const customer = await customers.findById(id);
    // Cast to any to avoid Mongoose Document vs Express.User type conflict
    done(null, customer as any);
  } catch (error) {
    done(error, null);
  }
});

// ============================================================================
// GOOGLE OAUTH 2.0 STRATEGY
// ============================================================================

if (config.google.clientID && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        scope: ["profile", "email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        // Using any for done callback to handle Mongoose Document type
        done: (error: Error | null, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          // Validate email exists
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

       

          // Find or create customer
          let customer = await customers.findOne({ customerEmail: email });

          if (customer) {
            // Update existing customer with Google info if needed
            if (customer.authProvider === "local") {
              customer.authProvider = "google";
              customer.socialId = profile.id;
            }
            if (!customer.isVerified) {
              customer.isVerified = true;
            }
            await customer.save();
          } else {
            // Create new customer
            customer = await customers.create({
              customerName: profile.displayName || profile.name?.givenName || "User",
              customerEmail: email,
              authProvider: "google",
              socialId: profile.id,
              isVerified: true,
              avatar: profile.photos?.[0]?.value,
              customerPhone: undefined // Ensure sparse index works
            });
          }

          return done(null, customer);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
  console.log("[Passport] ✓ Google OAuth strategy configured");
} else {
  console.warn("[Passport] ⚠ Google OAuth not configured - missing credentials");
}

// ============================================================================
// APPLE OAUTH STRATEGY
// ============================================================================
// NOTE: Apple uses POST for callbacks, which is handled in the route setup.

if (config.apple.clientID && config.apple.teamID && config.apple.keyID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: config.apple.clientID,
        teamID: config.apple.teamID,
        keyID: config.apple.keyID,
        privateKeyString: config.apple.privateKeyString,
        callbackURL: config.apple.callbackURL,
        passReqToCallback: false,
        scope: ["name", "email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        decodedIdToken: AppleDecodedIdToken,
        profile: AppleProfile,
        // Using any for done callback to handle Mongoose Document type
        done: (error: Error | null, user?: any) => void
      ) => {
        try {
          const email = decodedIdToken.email;

          // Validate email exists
          if (!email) {
            return done(new Error("No email found in Apple profile"));
          }

       

          // Apple only sends name on first authorization
          const userName = profile.name
            ? `${profile.name.firstName || ""} ${profile.name.lastName || ""}`.trim()
            : undefined;

          // Find or create customer
          let customer = await customers.findOne({ customerEmail: email });

          if (customer) {
            // Update existing customer with Apple info if needed
            if (customer.authProvider === "local") {
              customer.authProvider = "apple";
              customer.socialId = decodedIdToken.sub;
            }
            // Update name if not set and Apple provided it
            if (!customer.customerName && userName) {
              customer.customerName = userName;
            }
            if (!customer.isVerified) {
              customer.isVerified = true;
            }
            await customer.save();
          } else {
            // Create new customer
            customer = await customers.create({
              customerName: userName || "Apple User",
              customerEmail: email,
              authProvider: "apple",
              socialId: decodedIdToken.sub,
              isVerified: true,
              customerPhone: undefined // Ensure sparse index works
            });
          }

          return done(null, customer);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
  console.log("[Passport] ✓ Apple OAuth strategy configured");
} else {
  console.warn("[Passport] ⚠ Apple OAuth not configured - missing credentials");
}

// ============================================================================
// EXPORTS
// ============================================================================

export { passport, config };
export default passport;
