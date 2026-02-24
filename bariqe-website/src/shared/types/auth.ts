export interface User {
  _id: string;
  isGuest: boolean;
  isVerified: boolean;
  authProvider: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerSource?: string;
  customerLocation?: string;
  favorites: any[];
  addresses: any[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AuthResponse {
  status: number;
  message: string;
  result: {
    customer: User;
  };
}

export interface LoginCredentials {
  email: string;
  password?: string; // Optional if we support passwordless flows later, but strictly required for now
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}


export interface ResendOTPData {
  email: string;
}

export interface SocialLoginData {
  token: string;
  provider?: "google" | "apple";
}
