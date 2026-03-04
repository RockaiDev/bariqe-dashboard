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
        // User logged out - set profile to undefined to trigger immediate UI update
        queryClient.setQueryData(profileKeys.profile, undefined);
        
        // Invalidate the query so next fetch will be a fresh one
        queryClient.invalidateQueries({ queryKey: profileKeys.profile });
      } else {
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
