"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useProfile } from "@/shared/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard - Protects routes that should only be accessible to guests (unauthenticated users).
 * Redirects authenticated users away from login/register pages.
 * Uses useProfile hook to determine authentication status.
 */
const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();
  const { data: profile, isLoading, isError } = useProfile();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (profile && !isError) {
        // Profile fetched successfully - user is authenticated, redirect to home
        router.push("/");
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

  // If profile exists (user is authenticated), show loading while redirecting
  if (profile && !isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is a guest (no profile or error fetching) - render children
  return <>{children}</>;
};

export default GuestGuard;
