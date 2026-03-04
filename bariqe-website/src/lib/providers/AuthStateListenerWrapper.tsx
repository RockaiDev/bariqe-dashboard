"use client";

import { ReactNode } from "react";
import { useAuthStateListener } from "@/shared/hooks/useAuthStateListener";

interface AuthStateListenerProps {
  children: ReactNode;
}

/**
 * Wrapper component that sets up authentication state listeners.
 * Place this inside providers to ensure auth changes are detected globally.
 */
export function AuthStateListenerWrapper({ children }: AuthStateListenerProps) {
  useAuthStateListener();
  return <>{children}</>;
}
