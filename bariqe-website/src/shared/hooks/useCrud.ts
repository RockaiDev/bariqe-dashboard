import publicAxiosInstance from "@/lib/publicAxiosInstance";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import toast from "react-hot-toast";

interface CrudResponse {
  data: any[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
  count: number;
}

export function useCrud(resource: string, filters = {}) {
  const queryClient = useQueryClient();

  const list = useQuery<CrudResponse>({
    queryKey: [resource, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]: [string, any]) => {
        if (value && (Array.isArray(value) ? value.length : true)) {
          params.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
        }
      });

      const url = `/${resource}?${params}`;
      const response = await publicAxiosInstance.get(url) as CrudResponse;
      return response;
    },
    placeholderData: keepPreviousData,
  });

  // ✅ Create
  const create = useMutation({
    mutationFn: (payload: any) => {
      const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
      return publicAxiosInstance.post(`/${resource}`, payload, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });

  // ✅ Update
  const update = useMutation({
    mutationFn: ({ id, payload }: any) => {
      const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
      return publicAxiosInstance.put(`/${resource}/${id}`, payload, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });

  // ✅ Delete
  const del = useMutation({
    mutationFn: (id: string) => publicAxiosInstance.delete(`/${resource}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success('Deleted successfully!');
    },
    onError: () => toast.error('Failed to delete!'),
  });

  return { list, create, update, del };
}

export function useShow(resource: string, id: string | null | undefined) {
  return useQuery({
    queryKey: [resource, id],
    queryFn: async () => {
      if (!id) return null;
      const response = await publicAxiosInstance.get(`/${resource}/${id}`);
      return response;
    },
    enabled: !!id,
  });
}
