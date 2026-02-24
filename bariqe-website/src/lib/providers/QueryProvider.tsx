'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';
import { LoadingProvider } from './LoadingProvider';

interface QueryProviderProps {
  children: ReactNode;
}

// Configuration للـ QueryClient
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Time in milliseconds that unused/inactive cache data remains in memory
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Time in milliseconds that the cache survives unused/inactive
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        
        // If `false`, failed queries will not retry by default
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 408 (timeout)
          if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        
        // Retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Don't refetch on window focus in development
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        
        // Don't refetch on reconnect by default
        refetchOnReconnect: true,
        
        // Don't refetch on mount if data exists and is not stale
        refetchOnMount: true,
      },
      mutations: {
        // Global mutation options
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
};

export default function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
   
      {children}

      {/* DevTools - only show in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
        />
      )} */}
    </QueryClientProvider>
  );
}
