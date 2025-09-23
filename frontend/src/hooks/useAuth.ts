import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "@/helper/axiosInstance";

// Query key constants
export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

// API function for fetching admin data
const fetchAdminData = async () => {
  try {
    const response = await axios.get("/auth/me", { 
      withCredentials: true, 
      headers: { 'Cache-Control': 'no-store' } 
    });
    
    const apiBody = response as any;
    const adminData = apiBody?.result?.admin ?? apiBody?.admin ?? null;
    
    if (!adminData) {
      throw new Error('No admin data found');
    }
    
    return adminData;
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

export default function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: admin,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchAdminData,
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors (authentication issues)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    // Refetch on window focus if data is stale
    refetchOnWindowFocus: true,
    // Consider data stale after 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000, // استبدال cacheTime بـ gcTime في v5
  });

  // Handle errors with useEffect instead of onError
  useEffect(() => {
    if (isError && error) {
      console.error('Authentication error:', error);
      
      // If it's an auth error, clear the cache and redirect to login
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        queryClient.clear(); // Clear all cached data
        navigate("/login", { replace: true });
      }
    }
  }, [isError, error, queryClient, navigate]);

  // Computed values
  const authenticated = !isError && !!admin;

  // Refresh function to manually refetch admin data
  const refreshAdmin = () => {
    refetch();
  };

  // Function to invalidate and refetch admin data
  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  };

  // Function to update admin data in cache without refetching
  const updateAdminCache = (updatedAdmin: any) => {
    queryClient.setQueryData(AUTH_QUERY_KEY, updatedAdmin);
  };

  // Function to logout and clear all data
  const logout = () => {
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return { 
    loading, 
    authenticated, 
    admin: admin || null,
    isError,
    error,
    refreshAdmin,
    invalidateAdmin,
    updateAdminCache,
    logout,
  };
}