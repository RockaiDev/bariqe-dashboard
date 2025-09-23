import axios, { AxiosError } from "axios";
import type {
  AxiosRequestConfig,

  InternalAxiosRequestConfig,
} from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


const axiosInstance = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// متغير لحفظ دالة navigate
let navigateFunction: ((path: string) => void) | null = null;

// دالة لتعيين navigate function
export const setNavigate = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

// 🟢 Request Interceptor
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig<AxiosRequestConfig>) => {
    request.headers["lang"] = "en";
    return request;
  },
  (error: AxiosError) => Promise.reject(error)
);


// 🟢 Response Interceptor
// 🟢 Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Skip transforming blob responses
    if (response.config.responseType === 'blob') {
      return response;
    }
    // For regular JSON responses
    return response.data;
  },
  (error) => {
    // Handle errors
    if (error.response) {
      // Authentication errors
      if (error.response.status === 401) {
        if (navigateFunction && !window.location.pathname.includes('/login')) {
          navigateFunction('/login');
        } else if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      console.error("API Error:", error.response.data);
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error.message);
  }
);

export default axiosInstance;