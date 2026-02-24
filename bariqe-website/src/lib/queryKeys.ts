export const queryKeys = {
  // Products
  products: {
    all: ['public-products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query: string, params?: any) => [...queryKeys.products.all, 'search', query, params] as const,
    byCategory: (categoryId: string, params?: any) => [...queryKeys.products.all, 'category', categoryId, params] as const,
    advancedSearch: (params: any) => [...queryKeys.products.all, 'advanced-search', params] as const,
    batch: (productIds: string[]) => [...queryKeys.products.all, 'batch', productIds] as const,
    export: (params?: any) => [...queryKeys.products.all, 'export', params] as const,
    priceList: (params?: any) => [...queryKeys.products.all, 'price-list', params] as const,
  },
  
  // Categories
  categories: {
    all: ['public-categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  
  // Customers
  customers: {
    all: ['public-customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.customers.lists(), params] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  
  // Orders
  orders: {
    all: ['public-orders'] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    track: (trackingNumber: string) => [...queryKeys.orders.all, 'track', trackingNumber] as const,
  },
  
  // Events
  events: {
    all: ['public-events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.events.lists(), params] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },
  
  // Requests
  consultationRequests: {
    all: ['public-consultation-requests'] as const,
    details: () => [...queryKeys.consultationRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.consultationRequests.details(), id] as const,
  },
  
  materialRequests: {
    all: ['public-material-requests'] as const,
    details: () => [...queryKeys.materialRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.materialRequests.details(), id] as const,
  },
   contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.contacts.lists(), params] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },
    // Business Info
  businessInfo: {
    all: ['public-business-info'] as const,
    active: () => [...queryKeys.businessInfo.all, 'active'] as const,
    details: () => [...queryKeys.businessInfo.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.businessInfo.details(), id] as const,
    about: (id: string) => [...queryKeys.businessInfo.detail(id), 'about'] as const,
    reviews: (id: string) => [...queryKeys.businessInfo.detail(id), 'reviews'] as const,
    featuredReviews: (id: string) => [...queryKeys.businessInfo.detail(id), 'featured-reviews'] as const,
    members: (id: string) => [...queryKeys.businessInfo.detail(id), 'members'] as const,
    leadership: (id: string) => [...queryKeys.businessInfo.detail(id), 'leadership'] as const,
    partners: (id: string) => [...queryKeys.businessInfo.detail(id), 'partners'] as const,
    locations: (id: string) => [...queryKeys.businessInfo.detail(id), 'locations'] as const,
  },
} as const;
