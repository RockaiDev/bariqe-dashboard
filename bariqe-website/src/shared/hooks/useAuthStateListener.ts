"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/shared/hooks/useProfile";

/**
 * Hook that listens to auth-change events and invalidates profile queries.
 * This ensures the UI updates immediately after logout.
 * 
 * Usage: Just call this hook in a component that needs to react to auth changes
 * (typically in your root layout or app shell)
 */
export const useAuthStateListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAuthChange = () => {
      // Check if token still exists
      const hasToken = typeof window !== "undefined" && localStorage.getItem("token");
      
      if (!hasToken) {
        // User logged out - clear cached profile data to trigger immediate UI update
        // Do NOT invalidateQueries here, as that triggers a refetch which gets 401
        // again, causing an infinite loop (401 → auth-change → invalidate → refetch → 401)
        queryClient.setQueryData(profileKeys.profile, undefined);
        queryClient.cancelQueries({ queryKey: profileKeys.profile });
      }else {
        // User logged in - refetch profile
        queryClient.refetchQueries({ queryKey: profileKeys.profile });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-change", handleAuthChange);
      return () => {
        window.removeEventListener("auth-change", handleAuthChange);
      };
    }
  }, [queryClient]);
};
