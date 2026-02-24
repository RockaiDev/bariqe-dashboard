// hooks/usePageLoading.ts
"use client";

import { useEffect } from 'react';
import { useLoading } from '@/lib/providers/LoadingProvider';

export function usePageLoading(isLoading: boolean, message?: string) {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (isLoading) {
      showLoading(message);
    } else {
      hideLoading();
    }

    return () => {
      hideLoading();
    };
  }, [isLoading, message, showLoading, hideLoading]);
}
