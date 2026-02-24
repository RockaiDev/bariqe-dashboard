import jwt from "jsonwebtoken";
import ApiError from "../../utils/errors/ApiError";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;

export class AppleAuthService {
  
  /**
   * Verify Apple Token and get user info
   */
  public async verifyAppleToken(idToken: string) {
    try {
      // Full verification requires verifying signature with Apple public keys
      // For now, we will decode the token to get payload (Development Stub)
      // Production MUST verify signature!

      const decoded = jwt.decode(idToken) as any;
      
      if (!decoded) {
        throw new ApiError("UNAUTHORIZED", "Invalid Apple Token format");
      }

      if (APPLE_CLIENT_ID && decoded.aud !== APPLE_CLIENT_ID) {
         // console.warn("Apple Client ID mismatch");
      }

      return {
        email: decoded.email,
        sub: decoded.sub, // Apple User ID
        provider: "apple"
      };

    } catch (error: any) {
      console.error("Apple Auth Error:", error.message);
      throw new ApiError("UNAUTHORIZED", "Invalid Apple Token");
    }
  }
}

export default new AppleAuthService();
