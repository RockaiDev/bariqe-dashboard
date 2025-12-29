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
      return null;
    }

    return { admin: adminData, token };
  } catch (error: any) {
    const errorStatus = error?.response?.status || error?.result?.status || error?.status;
    if (errorStatus !== 401 && errorStatus !== 403) {
      console.error('Auth fetch error:', error);
    }
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
    isFetched,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchAdminData,
    enabled: !isInitialized, // Only run the initial check on startup
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      const errorStatus = error?.response?.status || error?.result?.status || error?.status;
      if (errorStatus === 401 || errorStatus === 403) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Keep the check result valid for the session
  });

  // Handle initialization and auth state sync
  useEffect(() => {
    if (isFetched) {
      if (data && !isError) {
        // Logged in successfully
        setAuth(data.admin, data.token);
      } else {
        // Not logged in or error
        if (isAuthenticated) {
          clearAuth();
        }
      }

      // Mark as initialized regardless of success/failure
      if (!isInitialized) {
        setInitialized(true);
      }
    }
  }, [isFetched, data, isError, isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized]);

  // Handle redirection on error (only for non-initial check or if specifically needed)
  useEffect(() => {
    if (isError && isInitialized && !isAuthenticated) {
      const errorData = error as any;
      const errorStatus = errorData?.response?.status || errorData?.result?.status || errorData?.status;

      if ((errorStatus === 401 || errorStatus === 403) && !window.location.pathname.includes('/login')) {
        navigate("/login", { replace: true });
      }
    }
  }, [isError, isInitialized, isAuthenticated, error, navigate]);

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