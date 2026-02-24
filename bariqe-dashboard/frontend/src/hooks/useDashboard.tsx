// hooks/useDashboard.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../helper/axiosInstance"

// =======================
// Types
// =======================
export interface ApiResponse<T> {
  status: number;
  message: string;
  result: T;
}

export interface DashboardData {
  summary: any;
  recentOrders: any[];
  recentRequests?: any[]; // backend uses 'recentRequests' in the combined /dashboard response
  recentConsultations?: any[]; // keep optional for compatibility
  orderTrends: any[];
  popularCategories: any[];
  stats: any;
  revenue: any;
}

export interface SummaryData {
  totalOrders: number;
  totalRevenue: number;
  totalConsultations: number;
  totalCustomers: number;
}

export interface Order {
  id: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface Consultation {
  id: string;
  customerName: string;
  topic: string;
  status: string;
  createdAt: string;
}

// =======================
// Helper function
// =======================
const fetchData = async <T,>(url: string): Promise<T> => {
  // axiosInstance's response interceptor returns the result directly
  const response = await axiosInstance.get(url);

  if (!response || typeof response !== "object") {
    throw new Error("Invalid API response");
  }

  return response as T;
};

// =======================
// Queries
// =======================
export const useDashboard = () => {
  const list = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetchData<DashboardData>("/dashboard"),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  return { list };
};

// Individual hooks now derive data from the main `/dashboard` query to avoid multiple network calls.
// They return the same shape as before but read from the dashboard cache if available.
export const useDashboardSummary = () => {
  const queryClient = useQueryClient();
  return useQuery<SummaryData>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      // Try to read from dashboard cache first
      const cached = queryClient.getQueryData<DashboardData>(["dashboard"]);
      if (cached?.summary) return cached.summary as SummaryData;
      // Fallback to fetching the single dashboard endpoint
      const full = await fetchData<DashboardData>("/dashboard");
      return full.summary as SummaryData;
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
};

export const useRecentOrders = () => {
  const queryClient = useQueryClient();
  return useQuery<Order[]>({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: async () => {
      const cached = queryClient.getQueryData<DashboardData>(["dashboard"]);
      if (cached?.recentOrders) return cached.recentOrders as Order[];
      const full = await fetchData<DashboardData>("/dashboard");
      return full.recentOrders as Order[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecentConsultations = () => {
  const queryClient = useQueryClient();
  return useQuery<Consultation[]>({
    queryKey: ["dashboard", "recent-consultations"],
    queryFn: async () => {
      const cached = queryClient.getQueryData<DashboardData>(["dashboard"]);
      // prefer 'recentRequests' (combined endpoint), fall back to 'recentConsultations'
      if (cached?.recentRequests) return cached.recentRequests as Consultation[];
      if (cached?.recentConsultations) return cached.recentConsultations as Consultation[];
      const full = await fetchData<DashboardData>("/dashboard");
      return (full.recentRequests || full.recentConsultations || []) as Consultation[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useOrderTrends = () => {
  const queryClient = useQueryClient();
  return useQuery<any[]>({
    queryKey: ["dashboard", "order-trends"],
    queryFn: async () => {
      const cached = queryClient.getQueryData<DashboardData>(["dashboard"]);
      if (cached?.orderTrends) return cached.orderTrends as any[];
      const full = await fetchData<DashboardData>("/dashboard");
      return full.orderTrends as any[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const usePopularCategories = () => {
  const queryClient = useQueryClient();
  return useQuery<any[]>({
    queryKey: ["dashboard", "popular-categories"],
    queryFn: async () => {
      const cached = queryClient.getQueryData<DashboardData>(["dashboard"]);
      if (cached?.popularCategories) return cached.popularCategories as any[];
      const full = await fetchData<DashboardData>("/dashboard");
      return full.popularCategories as any[];
    },
    staleTime: 10 * 60 * 1000,
  });
};
