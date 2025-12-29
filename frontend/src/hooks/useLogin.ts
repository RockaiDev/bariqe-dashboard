// hooks/useLogin.ts
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { loginRequest, type LoginPayload } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

export function useLogin(options?: UseMutationOptions<any, any, LoginPayload>) {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {

      if (data?.admin) {
        setAuth(data.admin, data.token);
        navigate('/dashboard', { replace: true });
      }
    },
    ...options,
  });
}