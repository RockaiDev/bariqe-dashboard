'use client';

import { useQueryClient as useReactQueryClient } from '@tanstack/react-query';

// Custom hook to get query client with proper typing
export const useQueryClient = () => {
  return useReactQueryClient();
};

// Utility functions for manual cache management
export const useQueryUtils = () => {
  const queryClient = useReactQueryClient();

  const invalidateQueries = (queryKey: string[]) => {
    return queryClient.invalidateQueries({ queryKey });
  };

  const removeQueries = (queryKey: string[]) => {
    return queryClient.removeQueries({ queryKey });
  };

  const setQueryData = (queryKey: string[], data: any) => {
    return queryClient.setQueryData(queryKey, data);
  };

  const getQueryData = (queryKey: string[]) => {
    return queryClient.getQueryData(queryKey);
  };

  const prefetchQuery = async (queryKey: string[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  };

  const cancelQueries = (queryKey: string[]) => {
    return queryClient.cancelQueries({ queryKey });
  };

  return {
    invalidateQueries,
    removeQueries,
    setQueryData,
    getQueryData,
    prefetchQuery,
    cancelQueries,
    queryClient,
  };
};
