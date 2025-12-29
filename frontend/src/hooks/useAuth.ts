// hooks/useAuth.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "@/helper/axiosInstance";
import { useAuthStore } from "@/stores/authStore";

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
    const adminData = apiBody?.admin ?? apiBody?.result?.admin ?? null;
    const token = apiBody?.token ?? apiBody?.result?.token ?? null;

    if (!adminData) {
      throw new Error('No admin data found');
    }

    return { admin: adminData, token };
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

export default function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isAuthenticated,
    admin,
    isLoading: storeLoading,
    isInitialized,
    setAuth,
    clearAuth,
    setLoading,
    setInitialized
  } = useAuthStore();

  const {
    data,
    isLoading: queryLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchAdminData,
    enabled: !isAuthenticated && isInitialized, // Only fetch if not authenticated and initialized
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1; // تقليل عدد المحاولات
    },
    refetchOnWindowFocus: false, // منع الـ refetch عند focus
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Initialize auth state on app start
  useEffect(() => {
    if (!isInitialized) {
      setInitialized(true);
    }
  }, [isInitialized, setInitialized]);

  // Update store when query succeeds
  useEffect(() => {
    if (data && !isError) {
      setAuth(data.admin, data.token);
    }
  }, [data, isError, setAuth]);

  // Handle authentication errors
  useEffect(() => {
    if (isError && error) {
      console.error('Authentication error:', error);

      const errorStatus = (error as any)?.response?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        clearAuth();
        queryClient.clear();
        navigate("/login", { replace: true });
      }
    }
  }, [isError, error, clearAuth, queryClient, navigate]);

  // Combined loading state
  const loading = storeLoading || (queryLoading && !isAuthenticated);

  // Refresh function
  const refreshAdmin = async () => {
    setLoading(true);
    try {
      const result = await refetch();
      if (result.data) {
        setAuth(result.data.admin, result.data.token);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Invalidate function
  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  };

  // Update cache function
  const updateAdminCache = (updatedAdmin: any) => {
    setAuth(updatedAdmin);
    const existing = queryClient.getQueryData<any>(AUTH_QUERY_KEY);
    queryClient.setQueryData(AUTH_QUERY_KEY, { ...existing, admin: updatedAdmin });
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/signout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  };

  return {
    loading,
    authenticated: isAuthenticated,
    admin: admin || null,
    isError,
    error,
    refreshAdmin,
    invalidateAdmin,
    updateAdminCache,
    logout,
  };
}