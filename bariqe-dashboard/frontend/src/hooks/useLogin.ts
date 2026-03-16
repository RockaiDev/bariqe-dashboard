// hooks/useLogin.ts
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { loginRequest, type LoginPayload } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { resetRedirecting } from "@/helper/axiosInstance";

export function useLogin(options?: UseMutationOptions<any, any, LoginPayload>) {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {

      if (data?.admin) {
        setAuth(data.admin, data.token);
        resetRedirecting();
        navigate('/dashboard', { replace: true });
      }
    },
    ...options,
  });
}