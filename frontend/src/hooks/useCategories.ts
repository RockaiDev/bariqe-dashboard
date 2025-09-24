// src/hooks/useCategories.ts
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";

export interface Category {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  categoryStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryFilters {
  page?: number;
  perPage?: number;
  sorts?: [string, "asc" | "desc"][];
  queries?: [string, string, any][]; // e.g. [["categoryStatus", "==", true]]
  search?: string;
}

interface CategoryResponse {
  data: Category[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    hasNextPage: boolean;
  };
  count: number;
}

async function fetchCategories(
  filters: CategoryFilters
): Promise<CategoryResponse> {
  try {
    const response = await axiosInstance.get("/categories", {
      params: filters,
    }) as CategoryResponse;

    if (!response || typeof response !== 'object') {
      throw new Error("Invalid response structure");
    }

    if (!response.data || !Array.isArray(response.data)) {
      return {
        data: [],
        pagination: {
          currentPage: 1,
          perPage: 15,
          total: 0,
          hasNextPage: false,
        },
        count: 0,
      };
    }

    return response;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch categories."
    );
  }
}

export default function useCategories(filters: CategoryFilters) {
  return useQuery<CategoryResponse, Error>({
    queryKey: ["categories", filters],
    queryFn: async () => {
      try {
        const result = await fetchCategories(filters);
        
        if (result === undefined || result === null) {
          return {
            data: [],
            pagination: {
              currentPage: 1,
              perPage: 15,
              total: 0,
              hasNextPage: false,
            },
            count: 0,
          };
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/categories/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueriesData({ queryKey: ["categories"] });

      previous.forEach(([key, data]: any) => {
        if (!data) return;
        if (!data.data) return;
        const newData = {
          ...data,
          data: data.data.filter((c: any) => c._id !== id),
          pagination: data.pagination
            ? { ...data.pagination, total: Math.max(0, data.pagination.total - 1) }
            : data.pagination,
        };
        queryClient.setQueryData(key, newData);
      });

      return { previous } as any;
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
