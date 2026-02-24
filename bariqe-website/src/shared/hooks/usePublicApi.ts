import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useEffect, useCallback } from "react";
import { queryKeys } from "@/lib/queryKeys";
import {
  publicApiService,
  type CreateOrderData,
  type CreateCustomerData,
  type CreateConsultationData,
  type CreateMaterialRequestData,
  type Product,
  type Category,
  type Customer,
  type CreateContactData,
  type Contact,
  BusinessInfo,
  Review,
  TeamMember,
  Partner,
  BusinessLocation,
} from "@/lib/publicApiService";

// Define API Response Types
type ApiResponse<T> = {
  data: T;
  pagination?: {
    page: number;  // Changed from currentPage to page
    perPage: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  } | null;
  count?: number;
};

type ProductsResponse = ApiResponse<Product[]>;
type CategoriesResponse = Category[];
type CustomersResponse = ApiResponse<Customer[]>;

// Product Export Types
type ProductExportParams = {
  categoryId?: string;
  status?: string;
  form?: string;
  dateRange?: string;
  purity?: string;
  grade?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sorts?: any[];
  queries?: any[];
};

// Enhanced error handling utility
const handleError = (
  error: any,
  defaultMessage: string,
  showToast: boolean = true
) => {
  // Try different error message paths
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.result?.message ||
    error?.data?.message ||
    error?.data?.result?.message ||
    error?.message ||
    defaultMessage;

  if (showToast) {
    toast.error(message);
  }

  console.log("API Error:", {
    message,
    error,
    timestamp: new Date().toISOString(),
  });

  return message;
};

// Enhanced custom hook للتعامل مع الأخطاء في useQuery
const useQueryWithErrorHandling = <T = any>(
  queryResult: any,
  errorMessage: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const { showErrorToast = true, onError } = options || {};

  useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      const message = handleError(
        queryResult.error,
        errorMessage,
        showErrorToast
      );
      onError?.(queryResult.error, message);
    }
  }, [
    queryResult.isError,
    queryResult.error,
    errorMessage,
    showErrorToast,
    onError,
  ]);

  return queryResult as typeof queryResult & {
    data: T;
  };
};

// ========== PRODUCTS HOOKS ==========
export const usePublicProducts = (params?: {
  currentPage?: number;  // This will be transformed to 'page' in the API call
  perPage?: number;
  categoryId?: string;
  search?: string;
  status?: string;
  form?: string;
  dateRange?: string;
  minPrice?: number;
  maxPrice?: number;
  purity?: string;
  grade?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) => {
  const queryResult = useQuery<ProductsResponse>({
    queryKey: queryKeys.products.list(params),
    queryFn: () => publicApiService.getProducts(params),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return useQueryWithErrorHandling<ProductsResponse>(
    queryResult,
    "Failed to load products"
  );
};

export const usePublicProduct = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<Product>({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => publicApiService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<Product>(
    queryResult,
    "Failed to load product",
    options
  );
};

export const usePublicProductSearch = (
  query: string,
  params?: { page?: number; perPage?: number }
) => {
  const queryResult = useQuery<ProductsResponse>({
    queryKey: queryKeys.products.search(query, params),
    queryFn: () => publicApiService.searchProducts(query, params),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return useQueryWithErrorHandling<ProductsResponse>(
    queryResult,
    "Failed to search products"
  );
};

export const usePublicProductsByCategory = (
  categoryId: string,
  params?: { page?: number; perPage?: number }
) => {
  const queryResult = useQuery<ProductsResponse>({
    queryKey: queryKeys.products.byCategory(categoryId, params),
    queryFn: () => publicApiService.getProductsByCategory(categoryId, params),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<ProductsResponse>(
    queryResult,
    "Failed to load products by category"
  );
};

// Advanced search hook
export const useAdvancedProductSearch = (filters: {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  form?: string;
  purity?: string;
  grade?: string;
  dateRange?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) => {
  const queryResult = useQuery<ProductsResponse>({
    queryKey: queryKeys.products.advancedSearch(filters),
    queryFn: () => publicApiService.advancedSearch(filters),
    enabled: !!(
      filters.search ||
      filters.categoryId ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.status ||
      filters.form ||
      filters.purity ||
      filters.grade ||
      filters.dateRange
    ),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return useQueryWithErrorHandling<ProductsResponse>(
    queryResult,
    "Failed to perform advanced search"
  );
};

// ========== EXPORT & DOWNLOAD HOOKS ==========

// ========== CATEGORIES HOOKS ==========
export const usePublicCategories = () => {
  const queryResult = useQuery<CategoriesResponse>({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => publicApiService.getCategories(),
    staleTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return useQueryWithErrorHandling<CategoriesResponse>(
    queryResult,
    "Failed to load categories"
  );
};

export const usePublicCategory = (id: string) => {
  const queryResult = useQuery<Category>({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => publicApiService.getCategory(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<Category>(
    queryResult,
    "Failed to load category"
  );
};

// ========== CUSTOMERS HOOKS ==========
export const useCreatePublicCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerData: CreateCustomerData) =>
      publicApiService.createCustomer(customerData),
    onSuccess: (newCustomer: any) => {
      toast.success("Customer created successfully!");

      // Update cache
      if (newCustomer && (newCustomer._id || newCustomer.id)) {
        queryClient.setQueryData(
          queryKeys.customers.detail(newCustomer._id || newCustomer.id),
          newCustomer
        );
      }

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.lists(),
      });
    },
    onError: (error: any) => handleError(error, "Failed to create customer"),
  });
};

export const useUpdatePublicCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCustomerData>;
    }) => publicApiService.updateCustomer(id, data),
    onSuccess: (updatedCustomer, { id }) => {
      toast.success("Customer updated successfully!");

      // Update specific customer cache
      queryClient.setQueryData(queryKeys.customers.detail(id), updatedCustomer);

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.lists(),
      });
    },
    onError: (error: any) => handleError(error, "Failed to update customer"),
  });
};

export const usePublicCustomer = (id: string) => {
  const queryResult = useQuery<Customer>({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => publicApiService.getCustomer(id),
    enabled: !!id,
    retry: 2,
  });

  return useQueryWithErrorHandling<Customer>(
    queryResult,
    "Failed to load customer"
  );
};

export const usePublicCustomers = (params?: {
  page?: number;
  perPage?: number;
}) => {
  const queryResult = useQuery<CustomersResponse>({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => publicApiService.getCustomers(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<CustomersResponse>(
    queryResult,
    "Failed to load customers"
  );
};

// ========== ORDERS HOOKS ==========
export const usePublicOrder = (id: string) => {
  const queryResult = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => publicApiService.getOrder(id),
    enabled: !!id,
    retry: 2,
  });

  return useQueryWithErrorHandling(queryResult, "Failed to load order");
};

export const useTrackOrder = (trackingNumber: string) => {
  const queryResult = useQuery({
    queryKey: queryKeys.orders.track(trackingNumber),
    queryFn: () => publicApiService.trackOrder(trackingNumber),
    enabled: !!trackingNumber,
    retry: 2,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  return useQueryWithErrorHandling(queryResult, "Failed to track order");
};

// ========== CONSULTATION REQUESTS HOOKS ==========
export const useCreateConsultationRequest = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateConsultationData) =>
      publicApiService.createConsultationRequest(data),
    onSuccess: (response) => {
      toast.success("Consultation request sent successfully!");

      // Navigate to consultation request page if ID is available
      if (response && (response._id || response.id)) {
        router.push(`/consultation-requests/${response._id || response.id}`);
      }
    },
    onError: (error: any) =>
      handleError(error, "Failed to send consultation request"),
  });
};

export const usePublicConsultationRequest = (id: string) => {
  const queryResult = useQuery({
    queryKey: queryKeys.consultationRequests.detail(id),
    queryFn: () => publicApiService.getConsultationRequest(id),
    enabled: !!id,
    retry: 2,
  });

  return useQueryWithErrorHandling(
    queryResult,
    "Failed to load consultation request"
  );
};

// ========== MATERIAL REQUESTS HOOKS ==========
export const useCreateMaterialRequest = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateMaterialRequestData) =>
      publicApiService.createMaterialRequest(data),
    onSuccess: (response) => {
      toast.success("Material request sent successfully!");

      // Navigate to material request page if ID is available
      if (response && (response._id || response.id)) {
        router.push(`/material-requests/${response._id || response.id}`);
      }
    },
    onError: (error: any) =>
      handleError(error, "Failed to send material request"),
  });
};

export const usePublicMaterialRequest = (id: string) => {
  const queryResult = useQuery({
    queryKey: queryKeys.materialRequests.detail(id),
    queryFn: () => publicApiService.getMaterialRequest(id),
    enabled: !!id,
    retry: 2,
  });

  return useQueryWithErrorHandling(
    queryResult,
    "Failed to load material request"
  );
};

// ========== EVENTS HOOKS ==========
export const usePublicEvents = (params?: {
  page?: number;
  perPage?: number;
}) => {
  const queryResult = useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => publicApiService.getEvents(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling(queryResult, "Failed to load events");
};

export const usePublicEvent = (id: string) => {
  const queryResult = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => publicApiService.getEvent(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling(queryResult, "Failed to load event");
};

// ========== BATCH OPERATIONS ==========
export const useBatchProductsQuery = (productIds: string[]) => {
  const queryResult = useQuery<Product[]>({
    queryKey: queryKeys.products.batch(productIds),
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const products = await Promise.allSettled(
        productIds.map((id) => publicApiService.getProduct(id))
      );

      // Filter out failed requests and return only successful ones
      return products
        .filter(
          (result): result is PromiseFulfilledResult<Product> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<Product[]>(
    queryResult,
    "Failed to load multiple products"
  );
};

// ========== UTILITY HOOKS ==========

// Prefetch product data
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => publicApiService.getProduct(id),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
};

// Check if product is in cache
export const useProductFromCache = (id: string) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.getQueryData(queryKeys.products.detail(id));
  }, [queryClient, id]);
};

// Invalidate specific queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProducts: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    invalidateCustomers: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
    invalidateOrders: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    invalidateEvents: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  };
};

// ========== CONTACTS HOOKS ==========
export const useCreatePublicContact = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateContactData) =>
      publicApiService.createContact(data),
    onSuccess: (response) => {
      toast.success(
        "Your message has been sent successfully! We will get back to you soon."
      );

      // Navigate to success page or contact detail if ID is available
      if (response && (response._id || response.id)) {
        // يمكنك إما الذهاب لصفحة تفاصيل الاتصال أو صفحة شكر
        // router.push(`/contact/success?id=${response._id || response.id}`);
      }
    },
    onError: (error: any) =>
      handleError(error, "Failed to send your message. Please try again."),
  });
};

export const usePublicContact = (id: string) => {
  const queryResult = useQuery<Contact>({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => publicApiService.getContact(id),
    enabled: !!id,
    retry: 2,
  });

  return useQueryWithErrorHandling<Contact>(
    queryResult,
    "Failed to load contact"
  );
};
// ========== BUSINESS INFO HOOKS ==========

/**
 * Get active business info (main business information)
 */
export const usePublicBusinessInfo = (options?: {
  showErrorToast?: boolean;
  onError?: (error: any, message: string) => void;
}) => {
  const queryResult = useQuery<BusinessInfo>({
    queryKey: queryKeys.businessInfo.active(),
    queryFn: () => publicApiService.getBusinessInfo(),
    staleTime: 30 * 60 * 1000, // 30 minutes - business info doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return useQueryWithErrorHandling<BusinessInfo>(
    queryResult,
    "Failed to load business information",
    options
  );
};

/**
 * Get business info by ID
 */
export const usePublicBusinessInfoById = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<BusinessInfo>({
    queryKey: queryKeys.businessInfo.detail(id),
    queryFn: () => publicApiService.getBusinessInfoById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<BusinessInfo>(
    queryResult,
    "Failed to load business information",
    options
  );
};

/**
 * Get About section (for About Us page)
 */
export const useBusinessInfoAbout = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<BusinessInfo["about"]>({
    queryKey: queryKeys.businessInfo.about(id),
    queryFn: () => publicApiService.getBusinessInfoAbout(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<BusinessInfo["about"]>(
    queryResult,
    "Failed to load about section",
    options
  );
};

/**
 * Get Reviews (for Testimonials page)
 */
export const useBusinessInfoReviews = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<BusinessInfo["reviews"]>({
    queryKey: queryKeys.businessInfo.reviews(id),
    queryFn: () => publicApiService.getBusinessInfoReviews(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });

  return useQueryWithErrorHandling<BusinessInfo["reviews"]>(
    queryResult,
    "Failed to load reviews",
    options
  );
};

/**
 * Get Featured Reviews only (for homepage)
 */
export const useFeaturedReviews = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<Review[]>({
    queryKey: queryKeys.businessInfo.featuredReviews(id),
    queryFn: () => publicApiService.getFeaturedReviews(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<Review[]>(
    queryResult,
    "Failed to load featured reviews",
    options
  );
};

/**
 * Get Team Members (for Team page)
 */
export const useBusinessInfoMembers = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<TeamMember[]>({
    queryKey: queryKeys.businessInfo.members(id),
    queryFn: () => publicApiService.getBusinessInfoMembers(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<TeamMember[]>(
    queryResult,
    "Failed to load team members",
    options
  );
};

/**
 * Get Leadership Team only
 */
export const useLeadershipTeam = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<TeamMember[]>({
    queryKey: queryKeys.businessInfo.leadership(id),
    queryFn: () => publicApiService.getLeadershipTeam(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<TeamMember[]>(
    queryResult,
    "Failed to load leadership team",
    options
  );
};

/**
 * Get Business Partners (for Partners page)
 */
export const useBusinessInfoPartners = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<Partner[]>({
    queryKey: queryKeys.businessInfo.partners(id),
    queryFn: () => publicApiService.getBusinessInfoPartners(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<Partner[]>(
    queryResult,
    "Failed to load partners",
    options
  );
};

/**
 * Get Locations (for Contact page)
 */


export const useBusinessInfoLocations = (
  id: string,
  options?: {
    showErrorToast?: boolean;
    onError?: (error: any, message: string) => void;
  }
) => {
  const queryResult = useQuery<BusinessLocation[]>({ 
    queryKey: queryKeys.businessInfo.locations(id),
    queryFn: () => publicApiService.getBusinessInfoLocations(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return useQueryWithErrorHandling<BusinessLocation[]>(
    queryResult,
    "Failed to load locations",
    options
  );
};
// ========== BUSINESS INFO UTILITY HOOKS ==========

/**
 * Prefetch business info data
 */
export const usePrefetchBusinessInfo = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.businessInfo.active(),
      queryFn: () => publicApiService.getBusinessInfo(),
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Get business info from cache
 */
export const useBusinessInfoFromCache = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.getQueryData<BusinessInfo>(
      queryKeys.businessInfo.active()
    );
  }, [queryClient]);
};

/**
 * Invalidate business info queries
 */
export const useInvalidateBusinessInfo = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.businessInfo.all });
  }, [queryClient]);
};

