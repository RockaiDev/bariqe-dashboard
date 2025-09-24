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
  result: {
    data: Category[];
    pagination: {
      currentPage: number;
      perPage: number;
      total: number;
      hasNextPage: boolean;
    };
  };
  keys: string[];
}

async function fetchCategories(
  filters: CategoryFilters
): Promise<CategoryResponse> {
  try {
    const response = await axiosInstance.get("/categories", {
      params: filters,
    });

    return response.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.result.message || "Failed to fetch categories."
    );
  }
}

export default function useCategories(filters: CategoryFilters) {
  return useQuery<CategoryResponse, Error>({
    queryKey: ["categories", filters],
    queryFn: () => fetchCategories(filters),
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
        if (!data.result?.data) return;
        const newData = {
          ...data,
          result: {
            ...data.result,
            data: data.result.data.filter((c: any) => c._id !== id),
            pagination: data.result.pagination
              ? { ...data.result.pagination, total: Math.max(0, data.result.pagination.total - 1) }
              : data.result.pagination,
          },
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
