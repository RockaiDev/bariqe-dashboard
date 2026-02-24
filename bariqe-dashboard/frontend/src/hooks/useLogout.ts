import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutRequest } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    console.log("Starting logout process...");
    try {
      // ✅ Clear state first for immediate UI response
      clearAuth();
      queryClient.clear();
      console.log("Local auth state cleared");

      // ✅ Hard redirect to ensure all states are reset
      window.location.href = "/login";
    } catch (err) {
      console.error("Error during local logout cleanup:", err);
      window.location.href = "/login";
    }
  };

  return useMutation({
    mutationFn: async () => {
      console.log("Sending logout request to server...");
      return logoutRequest();
    },
    onSuccess: () => {
      console.log("Server logout successful");
      handleLogout();
    },
    onError: (error) => {
      console.warn("Server logout failed, but proceeding with local cleanup", error);
      handleLogout();
    },
  });
}