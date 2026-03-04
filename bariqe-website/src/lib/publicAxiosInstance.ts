import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const publicAxiosInstance = axios.create({
  baseURL: `${BASE}`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
publicAxiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig<AxiosRequestConfig>) => {
    // Set language from URL if possible, default to 'ar'
    let lang = "ar";
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split('/');
      // Assuming URL structure like /en/cart or /ar/cart
      if (pathParts[1] === "en" || pathParts[1] === "ar") {
        lang = pathParts[1];
      }
    }
    request.headers["lang"] = lang;

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        request.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return request;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Fixed for blob handling
publicAxiosInstance.interceptors.response.use(
  (response) => {
    // Skip transforming blob responses
    if (response.config.responseType === 'blob') {
      return response;
    }

    // Check if response has the expected structure
    if (response.data?.result?.result) {
      return response.data.result.result;
    }

    // Return the response data as is if structure is different
    return response.data || response;
  },
  (error) => {
    // Log error for debugging
    console.log('Public API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      // Handle 401 Unauthorized - clear auth state
      if (error.response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Dispatch auth-change event so all listeners know about logout
          window.dispatchEvent(new Event("auth-change"));
        }
      }

      // For blob responses with errors, we need to read the blob
      if (error.config?.responseType === 'blob' && error.response.data instanceof Blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              reject({
                status: error.response.status,
                message: errorData.message || 'Export failed',
                data: errorData
              });
            } catch (e) {
              reject({
                status: error.response.status,
                message: 'Export failed',
                data: reader.result
              });
            }
          };
          reader.onerror = () => {
            reject({
              status: error.response.status,
              message: 'Failed to read error response'
            });
          };
          reader.readAsText(error.response.data);
        });
      }

      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        data: error.response.data
      });
    }

    return Promise.reject({
      message: error.message || 'Network error occurred'
    });
  }
);

export default publicAxiosInstance;
