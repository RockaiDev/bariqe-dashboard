/**
 * Gmail API OAuth2 Configuration
 * 
 * This module initializes the Gmail API client with OAuth2 credentials.
 * It handles authentication and provides methods for sending emails via Gmail API.
 * 
 * Required Environment Variables:
 * - GMAIL_CLIENT_ID: OAuth2 Client ID
 * - GMAIL_CLIENT_SECRET: OAuth2 Client Secret
 * - GMAIL_REFRESH_TOKEN: OAuth2 Refresh Token (must have mail.send scope)
 * - GMAIL_SENDER_EMAIL: Email address to send from (must be authorized in OAuth2 app)
 */

import { google } from "googleapis";
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
 * Create OAuth2 client with refresh token
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost" // Redirect URI (not used for refresh token flow)
);

// Set refresh token to get new access tokens automatically
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

/**
 * Create nodemailer transporter using OAuth2
 * This uses the OAuth2 client to automatically refresh tokens as needed
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
 * Test Gmail API connection
 * Verify that authentication is working correctly
 */
export const testGmailConnection = async () => {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    console.log("✅ Gmail OAuth2 authentication successful");
    console.log(
      `📧 Sender email: ${process.env.GMAIL_SENDER_EMAIL}`
    );
    return true;
  } catch (error) {
    console.error("❌ Gmail OAuth2 authentication failed:", error);
    return false;
  }
};

/**
 * Alternative: Use Gmail API directly (if nodemailer approach fails)
 * Returns the Gmail API client instance
 */
export const getGmailClient = () => {
  return google.gmail({ version: "v1", auth: oauth2Client });
};
