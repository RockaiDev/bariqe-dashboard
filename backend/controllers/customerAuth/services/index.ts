import { sign, verify } from "jsonwebtoken";
import AuthFeatures from "../../../services/auth";
import customers from "../../../models/customerSchema";
import ApiError from "../../../utils/errors/ApiError";
import otpService from "../../../services/otp";

const JWT_CUSTOMER = process.env.JWT_CUSTOMER || "customer_secret_key_fallback";

export default class CustomerAuthService extends AuthFeatures {
  
  // Override to use Customer JWT
  public GenerateToken(data: any) {
    return sign(data, JWT_CUSTOMER, { expiresIn: "30d" });
  }

  public VerifyTokenString(token: string) {
    try {
      return verify(token, JWT_CUSTOMER) as any;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a new customer
   */
  public async Register(body: any): Promise<any> {
    const { name, email, phone, password } = body;

    // Check if email exists
    const existingCustomer = await customers.findOne({ customerEmail: email });
    if (existingCustomer) {
      throw new ApiError("CONFLICT", "Email already registered");
    }

    // Check if phone exists (if provided)
    if (phone && phone.trim()) {
      const existingPhone = await customers.findOne({ customerPhone: phone });
      if (existingPhone) {
        throw new ApiError("CONFLICT", "Phone number already registered");
      }
    }

    // Generate Hash
    const hashedPassword = this.GenerateHash(password);

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpires = otpService.getExpiryDate();

    // Create Customer
    const newCustomer = await customers.create({
      customerName: name,
      customerEmail: email,
      customerPhone: phone && phone.trim() ? phone : undefined,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false,
      authProvider: "local"
    });

    // Send OTP Email
    await otpService.sendVerificationOTP(email, otp, name);

    return { message: "Registration successful. Please verify your email." };
  }

  /**
   * Verify Registration OTP
   */
  public async VerifyOTP(body: any): Promise<any> {
    const { email, otp } = body;
    
    // Explicitly select OTP fields since they are hidden (select: false)
    const customer = await customers.findOne({ customerEmail: email }).select("+otp +otpExpires");
    
    if (!customer) {
      throw new ApiError("NOT_FOUND", "Customer not found");
    }

    if (customer.isVerified) {
      throw new ApiError("BAD_REQUEST", "Account already verified");
    }

    const isValid = otpService.verifyOTP(otp, customer.otp || "", customer.otpExpires || new Date());
    if (!isValid) {
      throw new ApiError("BAD_REQUEST", "Invalid or expired OTP");
    }

    // Update customer
    customer.isVerified = true;
    customer.otp = undefined;
    customer.otpExpires = undefined;
    await customer.save();

    // Generate Token
    const token = this.GenerateToken({
      id: customer._id,
      email: customer.customerEmail,
      name: customer.customerName
    });

    return { token, customer, message: "Account verified successfully" };
  }

  /**
   * Resend Registration OTP
   */
  public async ResendOTP(body: any): Promise<any> {
    const { email } = body;
    const customer = await customers.findOne({ customerEmail: email });

    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
    if (customer.isVerified) throw new ApiError("BAD_REQUEST", "Account already verified");

    const otp = otpService.generateOTP();
    const otpExpires = otpService.getExpiryDate();

    customer.otp = otp;
    customer.otpExpires = otpExpires;
    await customer.save();

    await otpService.sendVerificationOTP(email, otp, customer.customerName || "Customer");

    return { message: "OTP resent successfully" };
  }

  /**
   * Login
   */
  public async Login(body: any): Promise<any> {
    const { email, password } = body;

    // Determine if login is by email or phone could be added here, currently assuming email
    const customer = await customers.findOne({ customerEmail: email }).select("+password");

    if (!customer) {
      throw new ApiError("UNAUTHORIZED", "Invalid credentials");
    }

    if (!customer.password) {
      throw new ApiError("BAD_REQUEST", "Please login using your social account");
    }

    const isMatch = this.CompareHash(password, customer.password);
    if (!isMatch) {
      throw new ApiError("UNAUTHORIZED", "Invalid credentials");
    }

    if (!customer.isVerified) {
      throw new ApiError("FORBIDDEN", "Please verify your email first");
    }

    const token = this.GenerateToken({
      id: customer._id,
      email: customer.customerEmail,
      name: customer.customerName
    });

    // Remove password from response
    const { password: _, ...customerData } = customer.toObject();

    return { token, customer: customerData };
  }

  /**
   * Forgot Password
   */
  public async ForgotPassword(body: any): Promise<any> {
    const { email } = body;
    const customer = await customers.findOne({ customerEmail: email });

    if (!customer) {
      // Return success even if not found to prevent enumeration
      return { message: "If an account exists, an OTP has been sent." };
    }

    const otp = otpService.generateOTP();
    const otpExpires = otpService.getExpiryDate();

    customer.resetPasswordOtp = otp;
    customer.resetPasswordOtpExpires = otpExpires;
    await customer.save();

    await otpService.sendPasswordResetOTP(email, otp, customer.customerName || "Customer");

    return { message: "If an account exists, an OTP has been sent." };
  }

  /**
   * Reset Password with OTP
   */
  public async ResetPassword(body: any): Promise<{message:string}> {
    const { email, otp, password } = body;
    const customer = await customers.findOne({ customerEmail: email }).select("+resetPasswordOtp +resetPasswordOtpExpires");
    if (!customer) {
      throw new ApiError("NOT_FOUND", "Request invalid");
    }

    const isValid = otpService.verifyOTP(otp, customer.resetPasswordOtp , customer.resetPasswordOtpExpires || new Date());
    if (!isValid) {
      throw new ApiError("BAD_REQUEST", "Invalid or expired OTP");
    }

    const hashedPassword = this.GenerateHash(password);
    customer.password = hashedPassword;
    customer.resetPasswordOtp = undefined;
    customer.resetPasswordOtpExpires = undefined;
    await customer.save();

    return { message: "Password reset successfully. Please login." };
  }

  /**
   * Social Login (Google/Apple)
   */
  public async SocialLogin(body: any): Promise<any> {
    const { provider, token, name } = body;
    let socialUser: any = null;

    if (provider === "google") {
      const googleService = require("../../../services/social-auth/google").default;
      socialUser = await googleService.verifyGoogleToken(token);
    } else if (provider === "apple") {
      const appleService = require("../../../services/social-auth/apple").default;
      socialUser = await appleService.verifyAppleToken(token);
      if (name && !socialUser.name) socialUser.name = name; // Apple sends name only once
    } else {
      throw new ApiError("BAD_REQUEST", "Invalid auth provider");
    }

    if (!socialUser || !socialUser.email) {
      throw new ApiError("UNAUTHORIZED", "Could not retrieve email from social provider");
    }

    // Find or Create User
    let customer = await customers.findOne({ customerEmail: socialUser.email });

    if (customer) {
      // Update info if needed, e.g. connect social ID
      if (customer.authProvider === "local") {
        customer.authProvider = provider; // Or allow multiple? for now, switch or link
        customer.socialId = socialUser.socialId;
      }
      if (!customer.isVerified) customer.isVerified = true; // Social login implies verified email
      await customer.save();
    } else {
      customer = await customers.create({
        customerName: socialUser.name || "Use",
        customerEmail: socialUser.email,
        authProvider: provider,
        socialId: socialUser.socialId,
        isVerified: true,
        avatar: socialUser.picture
      });
      
      // Send Welcome Email
      const { sendWelcomeEmail } = require("../../../services/email"); // Lazy load
      await sendWelcomeEmail(customer.customerEmail, customer.customerName);
    }

    const jwtToken = this.GenerateToken({
      id: customer._id,
      email: customer.customerEmail,
      name: customer.customerName
    });

    const { password: _, ...customerData } = customer.toObject();

    return { token: jwtToken, customer: customerData };
  }
}
