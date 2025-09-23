import { useMutation,type UseMutationOptions } from "@tanstack/react-query";
import { loginRequest, type LoginPayload } from "@/services/auth";

export function useLogin(options?: UseMutationOptions<any, any, LoginPayload>) {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    ...options,
  });
}