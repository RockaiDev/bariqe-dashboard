// src/hooks/useLogout.ts
import { useMutation } from "@tanstack/react-query";
import { logoutRequest } from "@/services/auth";

export function useLogout() {


  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      // ✅ امسح state / tokens لو في localstorage
      window.location.replace("/login");
    },
    onError: () => {
      // ممكن تضيف Error toast مثلا
      window.location.replace("/login");
    },
  });
}