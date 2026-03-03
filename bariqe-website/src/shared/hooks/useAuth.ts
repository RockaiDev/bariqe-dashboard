import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { toast } from "react-hot-toast";
import { authService } from "@/lib/services/auth";
import { AuthResponse } from "@/shared/types/auth";
import { profileKeys } from "@/shared/hooks/useProfile";

import { useFavoritesStore } from "@/shared/hooks/useFavoritesStore";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data: any) => {


      // Handle the case where the interceptor might have modified the structure
      // or if it matches AuthResponse structure
      const result = data.result || data;
      const customer = result.customer;
      const token = result.token;

      if (customer && customer.isVerified === false) {
        toast.error("Please verify your email first.");
        router.push(`/verify-otp?email=${encodeURIComponent(customer.customerEmail)}&type=register`);
        return;
      }


      toast.success(data.message || "Logged in successfully");
      queryClient.invalidateQueries({ queryKey: profileKeys.profile });

      // Sync favorites from backend after login
      useFavoritesStore.getState().syncFromBackend();

      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data: AuthResponse, variables) => {
      // After registration, redirect to verify-otp page for email verification
      // Don't store token yet - user needs to verify their email first

      // Use the email from the input variables since we know it's valid
      // This avoids issues with response structure transformation by the axios interceptor
      const email = variables.email;


      toast.success("Account created! Please verify your email.");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=register`);
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message);
    },
  });
};

export const useForgotPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_, variables) => {
      toast.success("OTP sent to your email");
      router.push(`/reset-password?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useVerifyOTP = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess: (data: any) => {
      const result = data.result || data;
      const token = result.token;
      const customer = result.customer;

      if (token && customer) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(customer));
        window.dispatchEvent(new Event("auth-change"));
        queryClient.invalidateQueries({ queryKey: profileKeys.profile });
      }

      toast.success(data.message || "Email verified successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success("Password reset successfully");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};
export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: authService.loginWithGoogle,
    onSuccess: (data: any) => {

      // If backend returns a URL to redirect to
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.result?.token) {
        // If it somehow returns a token directly (mock?)
        if (typeof window !== 'undefined') {
          localStorage.setItem("token", data.result.token);
          localStorage.setItem("user", JSON.stringify(data.result.customer));
          window.dispatchEvent(new Event('auth-change'));
          // Preserve locale when redirecting
          const locale = window.location.pathname.split('/')[1] || 'ar';
          window.location.href = `/${locale}`;
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: authService.resendOTP,
    onSuccess: (data) => {
      toast.success(data.message || "OTP resent successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useAppleLogin = () => {
  return useMutation({
    mutationFn: authService.loginWithApple,
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.result?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem("token", data.result.token);
          localStorage.setItem("user", JSON.stringify(data.result.customer));
          window.dispatchEvent(new Event('auth-change'));
          // Preserve locale when redirecting
          const locale = window.location.pathname.split('/')[1] || 'ar';
          window.location.href = `/${locale}`;
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-change"));
      }

      // Clear all queries from the cache
      queryClient.clear();

      // Reset favorites auth state
      useFavoritesStore.getState().setAuthenticated(false);

      toast.success("Logged out successfully");
      router.push("/");
    },
    onError: (error: any) => {
      // Even if server error, we clear local state
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-change"));
      }
      queryClient.clear();

      // Reset favorites auth state
      useFavoritesStore.getState().setAuthenticated(false);

      router.push("/");
    }
  });
};

