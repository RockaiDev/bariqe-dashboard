import crypto from 'crypto';
import { sendOtpEmail, sendPasswordResetOtp } from '../email';

export class OTPService {
  /**
   * Generate a 6-digit numeric OTP
   */
  public generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get OTP expiry date (default 10 minutes)
   */
  public getExpiryDate(minutes: number = 10): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  /**
   * Verify if OTP is valid and not expired
   */
  public verifyOTP(inputOtp: string, storedOtp: string, expiryDate: Date): boolean {
    if (!inputOtp || !storedOtp || !expiryDate) return false;
    if (new Date() > new Date(expiryDate)) return false;
    return inputOtp === storedOtp;
  }

  /**
   * Send Verification OTP via Email
   */
  public async sendVerificationOTP(email: string, otp: string, name: string): Promise<void> {
    await sendOtpEmail(email, otp, name);
  }

  /**
   * Send Password Reset OTP via Email
   */
  public async sendPasswordResetOTP(email: string, otp: string, name: string): Promise<void> {
    await sendPasswordResetOtp(email, otp, name);
  }
}

export default new OTPService();
