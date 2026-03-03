/**
 * Gmail OAuth2 Configuration with Nodemailer
 *
 * This module initializes nodemailer with Gmail OAuth2 authentication.
 * Nodemailer automatically handles OAuth2 token refresh, so no manual
 * token management is needed.
 *
 * Required Environment Variables:
 * - GMAIL_CLIENT_ID: OAuth2 Client ID from Google Cloud Console
 * - GMAIL_CLIENT_SECRET: OAuth2 Client Secret from Google Cloud Console
 * - GMAIL_REFRESH_TOKEN: OAuth2 Refresh Token from OAuth Playground
 * - GMAIL_SENDER_EMAIL: Email address to send from (must be Google-authorized)
 */

import nodemailer from "nodemailer";

// Validate that all required environment variables are present
const requiredEnvVars = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_SENDER_EMAIL",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️ Missing Gmail OAuth2 configuration: ${missingEnvVars.join(", ")}`
  );
  console.warn(
    "Email sending will not work. Please configure the above environment variables."
  );
}

/**
 * Create nodemailer transporter with Gmail OAuth2
 * Nodemailer automatically manages token refresh using the refresh token.
 * No manual OAuth2 client setup needed.
 */
export const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_SENDER_EMAIL,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});

/**
 * Test Gmail OAuth2 connection
 * Verifies that nodemailer can authenticate with Gmail
 */
export const testGmailConnection = async () => {
  try {
    await gmailTransporter.verify();
    console.log("✅ Gmail OAuth2 authentication successful");
    console.log(`📧 Sender email: ${process.env.GMAIL_SENDER_EMAIL}`);
    return true;
  } catch (error) {
    console.error("❌ Gmail OAuth2 authentication failed:", error);
    return false;
  }
};
