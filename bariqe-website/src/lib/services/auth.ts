import publicAxiosInstance from "@/lib/publicAxiosInstance";
import {
  AuthResponse,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  VerifyOTPData,
  ResendOTPData,
  SocialLoginData
} from "@/shared/types/auth";

export const authService = {
  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await publicAxiosInstance.post("/public/customer/login", data);
   
    return response as unknown as AuthResponse;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await publicAxiosInstance.post("/public/customer/register", data);
    return response as unknown as AuthResponse;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await publicAxiosInstance.post("/public/customer/forgot-password", data);
    return response as unknown as { message: string };
  },

  verifyOTP: async (data: VerifyOTPData): Promise<{ message: string; tempToken?: string }> => {
    const response = await publicAxiosInstance.post("/public/customer/verify-otp", data);
    return response as unknown as { message: string; tempToken?: string };
  },

  resendOTP: async (data: ResendOTPData): Promise<{ message: string }> => {
    const response = await publicAxiosInstance.post("/public/customer/resend-otp", data);
    return response as unknown as { message: string };
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await publicAxiosInstance.post("/public/customer/reset-password", data);
    return response as unknown as { message: string };
  },

  loginWithGoogle: async (): Promise<{ url: string }> => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    return { url: `${BASE}/api/auth/google` };
  },

  loginWithApple: async (): Promise<{ url: string }> => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    return { url: `${BASE}/api/auth/apple` };
  },

  logout: async (): Promise<{ message: string }> => {
    // We try to call the backend logout, but even if it fails (e.g. network),
    // the client-side logout (clearing tokens) should proceed in the hook.
    try {
      const response = await publicAxiosInstance.post("/public/customer/logout");
      return response as unknown as { message: string };
    } catch (error) {
       // If endpoint doesn't exist or fails, we still want to resolve so client can clear state
       return { message: "Logged out" };
    }
  },
};

