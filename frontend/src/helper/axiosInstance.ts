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

// دالة لتعيين navigate function
export const setNavigate = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

// 🟢 Request Interceptor
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig<AxiosRequestConfig>) => {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers["Authorization"] = `Bearer ${token}`;
    }
    request.headers["lang"] = "en";
    return request;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 🟢 Response Interceptor المحسن
axiosInstance.interceptors.response.use(
  (response) => {
    // Reset redirect flag on successful response
    isRedirecting = false;

    // Skip transforming blob responses
    if (response.config.responseType === 'blob') {
      return response;
    }

    const result = response.data.result?.result || response.data.result;
    return result;
  },
  (error) => {
    if (error.response) {
      // Authentication errors
      if (error.response.status === 401 && !isRedirecting) {
        isRedirecting = true;

        // Clear auth state immediately
        useAuthStore.getState().clearAuth();

        // Navigate to login
        if (navigateFunction && !window.location.pathname.includes('/login')) {
          navigateFunction('/login');
        } else if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        // Reset redirect flag after a delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error.message);
  }
);

export default axiosInstance;