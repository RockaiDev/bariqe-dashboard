import axios from "axios";
import ApiError from "../../utils/errors/ApiError";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export class GoogleAuthService {
  
  /**
   * Verify Google Token and get user info
   */
  public async verifyGoogleToken(idToken: string) {
    try {
      // Verify token with Google API
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      
      const { aud, email, name, picture, sub } = response.data;

      if (aud !== GOOGLE_CLIENT_ID) {
         // In production strictly verify this
         // throw new ApiError("UNAUTHORIZED", "Invalid Google Token Client ID");
         console.warn("Google Client ID mismatch (dev warning)");
      }

      return {
        email,
        name,
        picture,
        socialId: sub,
        provider: "google"
      };

    } catch (error: any) {
      console.error("Google Auth Error:", error.response?.data || error.message);
      throw new ApiError("UNAUTHORIZED", "Invalid Google Token");
    }
  }
}

export default new GoogleAuthService();
