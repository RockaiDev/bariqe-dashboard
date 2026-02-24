"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useProfile } from "@/shared/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Protects routes that require authentication.
 * Redirects unauthenticated users to the login page.
 * Uses useProfile hook to determine authentication status.
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const { data: profile, isLoading, isError } = useProfile();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (isError || !profile) {
        // Failed to fetch profile or no profile data - user is not authenticated
        router.push("/login");
      }
    }
  }, [isLoading, isError, profile, router]);

  // Show loading state while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's an error or no profile, show loading while redirecting
  if (isError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  return <>{children}</>;
};

export default AuthGuard;
