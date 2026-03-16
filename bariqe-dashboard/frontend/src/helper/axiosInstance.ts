// helper/axiosInstance.ts
import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// متغير لمنع multiple redirects
let isRedirecting = false;

// متغير لحفظ دالة navigate
let navigateFunction: ((path: string) => void) | null = null;

// Reset redirect flag — call after successful login
export const resetRedirecting = () => {
  isRedirecting = false;
};

// دالة لتعيين navigate function
export const setNavigate = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

// 🟢 Request Interceptor
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig<AxiosRequestConfig>) => {
    const token = useAuthStore.getState().token;
    const isAuthEndpoint = request.url?.startsWith('/auth/');

    // If no token and not an auth endpoint, cancel the request
    if (!token && !isAuthEndpoint) {
      const controller = new AbortController();
      request.signal = controller.signal;
      controller.abort('No auth token available');
      return request;
    }

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    request.headers["lang"] = "en";
    return request;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 🟢 Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Skip transforming blob responses
    if (response.config.responseType === 'blob') {
      return response;
    }

    const result = response.data.result?.result || response.data.result;
    return result;
  },
  (error) => {
    // Silently reject aborted requests (e.g. no-token guard)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response) {
      const isAuthEndpoint = error.config?.url?.startsWith('/auth/');

      // Handle 401 — clear auth and redirect once
      if (error.response.status === 401 && !isRedirecting && !isAuthEndpoint) {
        isRedirecting = true;

        useAuthStore.getState().clearAuth();

        if (!window.location.pathname.includes('/login')) {
          if (navigateFunction) {
            navigateFunction('/login');
          } else {
            window.location.href = '/login';
          }
        }

        // isRedirecting stays true until a fresh login succeeds
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error.message);
  }
);

export default axiosInstance;