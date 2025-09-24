// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "../helper/axiosInstance";

// =======================
// Types
// =======================
export interface ApiResponse<T> {
  status: number;
  message: string;
  result: T;
}

export interface EventFile {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface Event {
  _id?: string;
  titleAr: string;
  titleEn: string;
  date: string;
  tags: string[];
  contentAr: string;
  contentEn: string;
  image?: string;
  status: 'draft' | 'published' | 'archived';
  author?: string;
  files?: EventFile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventsListData {
  data: Event[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface EventsFilters {
  page?: number;
  perPage?: number;
  queries?: any[];
  sorts?: any[];
  search?: string;
}

export interface ImportResult {
  message: string;
  results: {
    events: {
      success: Event[];
      failed: any[];
      updated: Event[];
    };
    errors: any[];
    summary: {
      total: number;
      success: number;
      updated: number;
      failed: number;
      validationErrors: number;
    };
  };
}

const fetchBlob = async (url: string): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error('Blob fetch error:', error);
    throw new Error('Failed to download file');
  }
};

// =======================
// API Functions
// =======================
const eventsApi = {
  // List events
  list: async (filters: EventsFilters = {}): Promise<EventsListData> => {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]: [string, any]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            params.append(key, JSON.stringify(value));
          } else if (!Array.isArray(value)) {
            params.append(key, String(value));
          }
        }
      });
      
      const url = `/events${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Requesting:', url);
      
      const response :any = await axiosInstance.get(url);
      console.log('Events API Response:', response);
      
      // التعامل مع الهيكل الجديد للاستجابة
      const responseData  :any= response.result?.result;
      
      if (responseData?.data) {
        return {
          data: responseData.data,
          totalItems: responseData.count || responseData.data.length,
          totalPages: responseData.pagination?.totalPages || 1,
          currentPage: responseData.pagination?.currentPage || 1,
          perPage: responseData.pagination?.perPage || 10,
        };
      }

      // Fallback للهياكل الأخرى
      if (response?.result?.data) {
        return {
          data: response.result.data,
          totalItems: response.result.totalItems || response.result.data.length,
          totalPages: response.result.totalPages || 1,
          currentPage: response.result.currentPage || 1,
          perPage: response.result.perPage || 10,
        };
      }

      // إذا كانت البيانات array مباشرة
      if (Array.isArray(response.result?.result)) {
        return {
          data: response.result.result,
          totalItems: response.result.result.length,
          totalPages: 1,
          currentPage: 1,
          perPage: response.result.result.length,
        };
      }

      // البيانات في الجذر
      return {
        data: response.result?.events || [],
        totalItems: response.result?.totalItems || 0,
        totalPages: response.result?.totalPages || 1,
        currentPage: response.result?.currentPage || 1,
        perPage: response.result?.perPage || 10,
      };
      
    } catch (error: any) {
      console.error('Events list error:', error);
      throw error;
    }
  },

  // Get single event
  get: async (id: string): Promise<Event> => {
    try {
      const response :any= await axiosInstance.get(`/events/${id}`);
      console.log('Single event response:', response.data);
      
      // التعامل مع الهيكل الجديد
      if (response.result?.result) {
        return response.result.result;
      }

      if (response.result) {
        return response.result;
      }
      
      return response.result;
    } catch (error) {
      console.error('Get event error:', error);
      throw error;
    }
  },

  // Create event
  create: async (payload: FormData): Promise<Event> => {
    try {
      const response :any= await axiosInstance.post('/events', payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      console.log('Create event response:', response.data);
      
      // التعامل مع الهيكل الجديد
      if (response.result?.result) {
        return response.result.result;
      }

      if (response.result) {
        return response.result.result;
      }
      
      return response.result;
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  },

  // Update event
  update: async ({ id, payload }: { id: string; payload: FormData }): Promise<Event> => {
    try {
      const response = await axiosInstance.put(`/events/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // التعامل مع الهيكل الجديد
      if (response.data?.result?.result) {
        return response.data.result.result;
      }
      
      if (response.data?.result) {
        return response.data.result;
      }
      
      return response.data;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  },

  // Delete event
  delete: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/events/${id}`);
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  },

  // Remove file from event
  removeFile: async ({ eventId, fileId }: { eventId: string; fileId: string }): Promise<Event> => {
    try {
      const response = await axiosInstance.delete(`/events/${eventId}/files/${fileId}`);

      // التعامل مع الهيكل الجديد
      if (response.data?.result?.result) {
        return response.data.result.result;
      }
      
      if (response.data?.result) {
        return response.data.result;
      }
      
      return response.data;
    } catch (error) {
      console.error('Remove file error:', error);
      throw error;
    }
  },

  // Export events
  export: (): Promise<Blob> => fetchBlob('/events/export'),

  // Download template
  downloadTemplate: (): Promise<Blob> => fetchBlob('/events/download-template'),

  // Import events
  import: async (file: File): Promise<ImportResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post('/events/import', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // التعامل مع الهيكل الجديد
      if (response.data?.result?.result) {
        return response.data.result.result;
      }
      
      if (response.data?.result) {
        return response.data.result;
      }
      
      return response.data;
    } catch (error) {
      console.error('Import events error:', error);
      throw error;
    }
  },
};

// باقي الكود يبقى كما هو...
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: EventsFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export function useEvents(filters: EventsFilters = {}) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventsApi.list(filters),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const create = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create event');
    },
  });

  const update = useMutation({
    mutationFn: eventsApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
      toast.success('Event updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update event');
    },
  });

  const del = useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Event deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete event');
    },
  });

  return { list, create, update, del };
}

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useRemoveEventFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.removeFile,
    onSuccess: (data) => {
      if (data._id) {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(data._id) });
      }
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('File removed successfully!');
    },
    onError: (error: any) => {
      console.error('Remove file mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to remove file');
    },
  });
};

export const useExportEvents = () => {
  return useMutation({
    mutationFn: eventsApi.export,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `events_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Events exported successfully!');
    },
    onError: (error: any) => {
      console.error('Export mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to export events');
    },
  });
};

export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: eventsApi.downloadTemplate,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'events_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully!');
    },
    onError: (error: any) => {
      console.error('Template download mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to download template');
    },
  });
};

export const useImportEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.import,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success(data.message || 'Events imported successfully!');
    },
    onError: (error: any) => {
      console.error('Import mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to import events');
    },
  });
};

export { eventsApi };