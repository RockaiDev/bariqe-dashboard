import publicAxiosInstance from '@/lib/publicAxiosInstance';

export interface Product {
  _id: string;
  productNameAr: string;
  productNameEn: string;
  productDescriptionAr: string;
  productDescriptionEn: string;
  productPrice: number;
  productOldPrice?: number;
  productNewPrice?: number;
  productImage: string;
  productCategory: Category;
  productSubCategory: string;
  productStatus: string;
  productPurity?: string;
  productGrade?: string;
  productForm?: string;
  productDiscount?: number;
  productCode?: string;
  discountTiers?: Array<{ quantity: number; discount: number }>;
  productQuantity?: number;
  productMoreSale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categoryDescriptionAr: string;
  categoryDescriptionEn: string;
  categoryStatus: string;
}

export interface Customer {
  _id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerNotes?: string;
  customerSource?: string;
  customerAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  customer: string;
  products: Array<{
    product: string;
    quantity: number;
    itemDiscount?: number;
  }>;
  orderQuantity: string;
  orderDiscount?: number;
  orderStatus?: string;
  orderNotes?: string;
}

// ========== CHECKOUT TYPES (PayLink Integration) ==========
export interface CheckoutData {
  paymentMethod: "paylink" | "cod",
  customer?: string; // Optional customer ID for authenticated orders
  customerData: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    street: string;
    city: string;
    region?: string;
    postalCode?: string;
    country?: string;
    neighborhood?: string;
    building?: string;
    nationalAddress?: string;
  };
  products: Array<{
    product: string;
    quantity: number;
    itemDiscount?: number;
  }>;
  orderNotes?: string;
  callbackUrl?: string; // URL to redirect after payment
}

export interface CheckoutResponse {
  status: number;
  message: string;
  result: {
    order: {
      _id: string;
      orderNumber?: string;
      payment?: {
        status: string;
        paymentUrl: string;
        invoiceId?: string;
        transactionId?: string;
      };
      [key: string]: any;
    };
    paymentUrl: string;
    message: string;
  };
  // Optional flag for compatibility if interceptors add it
  success?: boolean;
}

export interface CreateCustomerData {
  customerName: string;
  customerEmail?: string; // ✅ جعلها optional
  customerPhone: string;
  customerNotes?: string;
  customerSource?: string;
  customerAddress?: string;
}

export interface CreateConsultationData {
  customer?: string; // إضافة customer field
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string; // إضافة customerAddress
  customerLocation?: string; // إضافة customerLocation
  subject: string;
  message: string;
  requestType: string;
}

export interface CreateMaterialRequestData {
  materialName: string;
  materialEmail?: string; // ✅ optional عندما يكون لدينا customer
  materialPhone?: string; // ✅ optional عندما يكون لدينا customer
  materialQuantity: number;
  materialIntendedUse: string;
  materialActions?: string;
  materialLocation?: string;
  customer?: string; // ✅ إضافة customer field
}
export interface Contact {
  _id: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  address: string;
  services: string[];
  message: string;
  status: boolean;
  customer?: {
    _id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  contactName: string;
  email: string;
  phoneNumber: string;
  message: string;
  customer?: string; // Optional customer ID
}
// ========== BUSINESS INFO TYPES ==========
export interface AboutSection {
  _id?: string;
  hero_image: string;
  title_ar?: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  display_order: number;
}

export interface TeamMember {
  _id?: string;
  name_ar: string;
  name_en: string;
  position_ar?: string;
  position_en?: string;
  bio_ar?: string;
  bio_en?: string;
  image?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  is_leadership: boolean;
  display_order: number;
}

export interface Partner {
  _id?: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  website?: string;
  display_order: number;
}

export interface BusinessLocation {  // ✅ تغيير من Location إلى BusinessLocation
  _id?: string;
  country_ar?: string;
  country_en?: string;
  city_ar?: string;
  city_en?: string;
  address_ar?: string;
  address_en?: string;
  phone?: string;
  email?: string;
  map_url?: string;
}
export interface Review {
  _id?: string;
  client_name_ar: string;
  client_name_en: string;
  client_position_ar?: string;
  client_position_en?: string;
  client_company_ar?: string;
  client_company_en?: string;
  client_image?: string;
  review_ar: string;
  review_en: string;
  rating: number;
  is_featured: boolean;
  display_order: number;
  created_at: Date;
}

export interface BusinessInfo {
  _id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  logo?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address_ar?: string;
  address_en?: string;
  facebook?: string;
  about: {
    hero_image?: string;
    main_title_ar?: string;
    main_title_en?: string;
    main_description_ar?: string;
    main_description_en?: string;
    sections: AboutSection[];
  };
  locations: BusinessLocation[];
  members: TeamMember[];
  partners: Partner[];
  reviews: {
    hero_image?: string;
    main_title_ar: string;
    main_title_en: string;
    main_description_ar: string;
    main_description_en: string;
    items: Review[];
  };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// New types for advanced filtering
type WhereTuple = [field: string, op: string, value: any];
type SortTuple = [field: string, dir?: 'asc' | 'desc'];

interface SortObject {
  field: string;
  direction: 'asc' | 'desc';
}

class PublicApiService {
  private isValidObjectId(id: string): boolean {
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  // Helper method to build queries
  private buildQueries(filters: {
    categoryId?: string;
    status?: string;
    form?: string;
    dateRange?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    purity?: string;
    grade?: string;
  }): WhereTuple[] {
    const queries: WhereTuple[] = [];

    // Category filter
    if (filters.categoryId && filters.categoryId !== 'all') {
      queries.push([
        '$or',
        'custom',
        [
          ['productSubCategory', '==', filters.categoryId],
          ['productCategory', '==', filters.categoryId]
        ],
      ]);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      queries.push(['productStatus', '==', true]);
    }

    // Form filter
    if (filters.form && filters.form !== 'all') {
      queries.push(['productForm', '==', filters.form]);
    }



    // Price range filters
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      queries.push(['productPrice', '>=', filters.minPrice]);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      queries.push(['productPrice', '<=', filters.maxPrice]);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'thisweek':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'thismonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        queries.push(['createdAt', '>=', startDate.toISOString()]);
      }
    }

    // Search filter - using $or custom operator
    if (filters.search) {
      const searchTerm = filters.search.trim();

      // ✅ إذا كان البحث عبارة عن MongoDB ObjectId صحيح
      if (this.isValidObjectId(searchTerm)) {
        // console.log('🔍 Searching by exact ID:', searchTerm);
        queries.push(['_id', '==', searchTerm]);
      } else {
        // ✅ البحث العادي بـ regex في الحقول النصية
        // console.log('🔍 Searching by text in multiple fields:', searchTerm);
        queries.push([
          '$or',
          'custom',
          [
            ['productNameAr', 'regex', searchTerm],
            ['productNameEn', 'regex', searchTerm],
            ['productDescriptionAr', 'regex', searchTerm],
            ['productDescriptionEn', 'regex', searchTerm],
            ['productCode', 'regex', searchTerm],
          ],
        ]);
      }
    }

    return queries;
  }

  // Helper method to build sorts
  private buildSorts(sortBy?: string, sortDirection?: 'asc' | 'desc'): SortTuple[] {
    if (sortBy) {
      return [[sortBy, sortDirection || 'desc']];
    }
    return [['createdAt', 'desc']]; // Default sort
  }

  // ========== PRODUCTS ==========
  async getProducts(params?: {
    currentPage?: number;  // Will be transformed to 'page' in the request
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
    sortDirection?: 'asc' | 'desc';
    sorts?: SortTuple[] | SortObject[];
    queries?: WhereTuple[];
  }) {
    try {
      const requestParams: any = {};

      // Basic pagination
      if (params?.currentPage) requestParams.page = params.currentPage;
      if (params?.perPage) requestParams.perPage = params.perPage;

      // Build queries from filters
      let queries = params?.queries || [];
      if (!queries.length) {
        queries = this.buildQueries({
          categoryId: params?.categoryId,
          status: params?.status,
          form: params?.form,
          dateRange: params?.dateRange,
          search: params?.search,
          minPrice: params?.minPrice,
          maxPrice: params?.maxPrice,
          purity: params?.purity,
          grade: params?.grade,
        });
      }

      // Build sorts
      let sorts = params?.sorts || [];
      if (!sorts.length) {
        sorts = this.buildSorts(params?.sortBy, params?.sortDirection);
      }

      // Convert SortObject[] to SortTuple[] if needed
      const normalizedSorts: SortTuple[] = sorts.map(sort => {
        if (Array.isArray(sort)) {
          return sort as SortTuple;
        } else {
          return [sort.field, sort.direction] as SortTuple;
        }
      });

      // Add to request params
      if (queries.length > 0) {
        requestParams.queries = JSON.stringify(queries);
      }

      if (normalizedSorts.length > 0) {
        requestParams.sorts = JSON.stringify(normalizedSorts);
      }

      // console.log('Request params:', requestParams);

      const response: any = await publicAxiosInstance.get('/public/products', { params: requestParams });
      // Transform response to match expected format
      return {
        data: response.data || response,
        pagination: response.pagination || null,
        count: response.count || 0,
      };
    } catch (error) {
      // console.log('Error fetching products:', error);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const response = await publicAxiosInstance.get(`/public/products/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async searchProducts(query: string, params?: { page?: number; perPage?: number }) {
    try {
      return this.getProducts({
        ...params,
        search: query
      });
    } catch (error) {
      throw error;
    }
  }

  async getProductsByCategory(categoryId: string, params?: { page?: number; perPage?: number }) {
    try {
      return this.getProducts({
        ...params,
        categoryId
      });
    } catch (error) {
      throw error;
    }
  }

  // Advanced search with multiple filters
  async advancedSearch(filters: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    form?: string;
    purity?: string;
    grade?: string;
    dateRange?: string;
    currentPage?: number;
    perPage?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    try {
      return this.getProducts({
        currentPage: filters.currentPage,
        perPage: filters.perPage,
        categoryId: filters.categoryId,
        search: filters.search,
        status: filters.status,
        form: filters.form,
        dateRange: filters.dateRange,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        purity: filters.purity,
        grade: filters.grade,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      });
    } catch (error) {
      throw error;
    }
  }



  // ========== EXPORT & DOWNLOAD ==========
  async exportProducts(params?: {
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
    sortDirection?: 'asc' | 'desc';
    sorts?: SortTuple[] | SortObject[];
    queries?: WhereTuple[];
  }) {
    try {
      const requestParams: any = {};

      // Build queries from filters
      let queries = params?.queries || [];
      if (!queries.length && params) {
        queries = this.buildQueries({
          categoryId: params.categoryId,
          status: params.status,
          form: params.form,
          dateRange: params.dateRange,
          search: params.search,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          purity: params.purity,
          grade: params.grade,
        });
      }

      // Build sorts
      let sorts = params?.sorts || [];
      if (!sorts.length && params) {
        sorts = this.buildSorts(params.sortBy, params.sortDirection);
      }

      // Convert SortObject[] to SortTuple[] if needed
      const normalizedSorts: SortTuple[] = sorts.map(sort => {
        if (Array.isArray(sort)) {
          return sort as SortTuple;
        } else {
          return [sort.field, sort.direction] as SortTuple;
        }
      });

      // Add to request params
      if (queries.length > 0) {
        requestParams.queries = JSON.stringify(queries);
      }

      if (normalizedSorts.length > 0) {
        requestParams.sorts = JSON.stringify(normalizedSorts);
      }

      // console.log('📤 Export request params:', requestParams);

      // ✅ استخدام endpoint مختلف أو إضافة action parameter
      const response = await publicAxiosInstance.get('/public/products/export', {
        params: requestParams,
        responseType: 'blob'
      });

      // console.log('✅ Export response received');
      return response;
    } catch (error) {
      // console.log('❌ Error exporting products:', error);
      throw error;
    }
  }

  // ========== CATEGORIES ==========
  async getCategories(): Promise<Category[]> {
    try {
      const response = await publicAxiosInstance.get('/public/categories');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async getCategory(id: string): Promise<Category> {
    try {
      const response = await publicAxiosInstance.get(`/public/categories/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== CUSTOMERS ==========

  async getCustomers(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    phone?: string;
    email?: string;
    name?: string;
    source?: string;
    queries?: WhereTuple[];
    sorts?: SortTuple[] | SortObject[];
  }) {
    try {
      const requestParams: any = {};

      // Basic pagination
      if (params?.page) requestParams.currentPage = params.page;
      if (params?.perPage) requestParams.perPage = params.perPage;

      // Build queries
      let queries: WhereTuple[] = params?.queries || [];

      if (!queries.length && params) {
        // Phone filter
        if (params.phone) {
          queries.push(['customerPhone', '==', params.phone]);
        }

        // Email filter
        if (params.email) {
          queries.push(['customerEmail', '==', params.email]);
        }

        // Name filter
        if (params.name) {
          queries.push(['customerName', 'regex', params.name]);
        }

        // Source filter
        if (params.source) {
          queries.push(['customerSource', '==', params.source]);
        }

        // General search filter
        if (params.search && params.search.trim()) {
          const searchValue = params.search.trim();
          queries.push([
            '$or',
            'custom',
            [
              ['customerName', 'regex', searchValue],
              ['customerPhone', 'regex', searchValue],
              ['customerEmail', 'regex', searchValue],
              ['customerAddress', 'regex', searchValue]
            ]
          ]);
        }
      }

      // Build sorts
      let sorts = params?.sorts || [];
      if (!sorts.length) {
        sorts = [['createdAt', 'desc']]; // Default sort
      }

      // Convert SortObject[] to SortTuple[] if needed
      const normalizedSorts: SortTuple[] = sorts.map(sort => {
        if (Array.isArray(sort)) {
          return sort as SortTuple;
        } else {
          return [sort.field, sort.direction] as SortTuple;
        }
      });

      // Add to request params
      if (queries.length > 0) {
        requestParams.queries = JSON.stringify(queries);
      }

      if (normalizedSorts.length > 0) {
        requestParams.sorts = JSON.stringify(normalizedSorts);
      }

      // console.log('🔍 Customer request params:', requestParams);

      const response: any = await publicAxiosInstance.get('/public/customers', { params: requestParams });

      return {
        data: response.data || response,
        pagination: response.pagination || null,
        count: response.count || 0,
      };
    } catch (error) {
      // console.log('❌ Error fetching customers:', error);
      throw error;
    }
  }

  // ✅ Helper method للبحث عن عميل بالهاتف
  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const response = await this.getCustomers({
        phone: phone.trim(),
        perPage: 1
      });

      return response.data?.[0] || null;
    } catch (error) {
      // console.log('❌ Error finding customer by phone:', error);
      throw error;
    }
  }

  // ✅ Helper method للبحث عن عميل بالإيميل
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await this.getCustomers({
        email: email.trim(),
        perPage: 1
      });

      return response.data?.[0] || null;
    } catch (error) {
      // console.log('❌ Error finding customer by email:', error);
      throw error;
    }
  }

  async getCustomer(id: string): Promise<Customer> {
    try {
      const response = await publicAxiosInstance.get(`/public/customers/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }




  async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    try {
      const response = await publicAxiosInstance.post('/public/customers', customerData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async updateCustomer(id: string, customerData: Partial<CreateCustomerData>): Promise<Customer> {
    try {
      const response = await publicAxiosInstance.patch(`/public/customers/${id}`, customerData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== ORDERS ==========
  async createOrder(orderData: CreateOrderData) {
    try {
      const response = await publicAxiosInstance.post('/public/orders', orderData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getOrder(id: string) {
    try {
      const response = await publicAxiosInstance.get(`/public/orders/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async trackOrder(trackingNumber: string) {
    try {
      const response = await publicAxiosInstance.get(`/public/orders/track/${trackingNumber}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== CHECKOUT (PayLink Integration) ==========
  /**
   * Initiates checkout process and returns PayLink payment URL
   * POST /public/orders/checkout
   */
  async checkout(checkoutData: CheckoutData): Promise<CheckoutResponse> {
    try {
      const response = await publicAxiosInstance.post('/public/orders/checkout', checkoutData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify payment status after PayLink callback
   * This is typically called after user returns from payment gateway
   */
  async verifyPayment(orderId: string): Promise<{ success: boolean; order: any }> {
    try {
      const response = await publicAxiosInstance.get(`/public/orders/${orderId}/verify-payment`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async verifyPaylinkWebhook(orderNumber: string, transactionNo: string) {
    try {
      // Allow calling the webhook endpoint directly from frontend
      const response = await publicAxiosInstance.get(`/public/orders/webhook/paylink`, {
        params: { orderNumber, transactionNo }
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== CONSULTATION REQUESTS ==========
  async createConsultationRequest(data: CreateConsultationData) {
    try {
      const response = await publicAxiosInstance.post('/public/consultation-requests', data);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async getConsultationRequest(id: string) {
    try {
      const response = await publicAxiosInstance.get(`/public/consultation-requests/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== MATERIAL REQUESTS ==========
  async createMaterialRequest(data: CreateMaterialRequestData) {
    try {
      const response = await publicAxiosInstance.post('/public/material-requests', data);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async getMaterialRequest(id: string) {
    try {
      const response = await publicAxiosInstance.get(`/public/material-requests/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  // ========== EVENTS ==========
  async getEvents(params?: { page?: number; perPage?: number }) {
    try {
      const response = await publicAxiosInstance.get('/public/events', { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getEvent(id: string) {
    try {
      const response = await publicAxiosInstance.get(`/public/events/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }
  // ========== CONTACTS ==========
  async createContact(data: CreateContactData) {
    try {
      const response = await publicAxiosInstance.post('/public/contacts', data);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async getContact(id: string): Promise<Contact> {
    try {
      const response = await publicAxiosInstance.get(`/public/contacts/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }


  // ========== BUSINESS INFO ==========

  /**
   * Get active business info (for website)
   */
  async getBusinessInfo(): Promise<BusinessInfo> {
    try {
      const response = await publicAxiosInstance.get('/public/business-info');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get business info by ID
   */
  async getBusinessInfoById(id: string): Promise<BusinessInfo> {
    try {
      const response = await publicAxiosInstance.get(`/public/business-info/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get About section from business info
   */
  async getBusinessInfoAbout(id: string): Promise<{
    hero_image?: string;
    main_title_ar?: string;
    main_title_en?: string;
    main_description_ar?: string;
    main_description_en?: string;
    sections: AboutSection[];
  }> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.about;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Reviews from business info
   */
  async getBusinessInfoReviews(id: string): Promise<{
    hero_image?: string;
    main_title_ar: string;
    main_title_en: string;
    main_description_ar: string;
    main_description_en: string;
    items: Review[];
  }> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured reviews only
   */
  async getFeaturedReviews(id: string): Promise<Review[]> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.reviews.items.filter(review => review.is_featured);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Team Members from business info
   */
  async getBusinessInfoMembers(id: string): Promise<TeamMember[]> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.members.sort((a, b) => a.display_order - b.display_order);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Leadership Team only
   */
  async getLeadershipTeam(id: string): Promise<TeamMember[]> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.members
        .filter(member => member.is_leadership)
        .sort((a, b) => a.display_order - b.display_order);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Partners from business info
   */
  async getBusinessInfoPartners(id: string): Promise<Partner[]> {
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.partners.sort((a, b) => a.display_order - b.display_order);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Locations from business info
   */
  async getBusinessInfoLocations(id: string): Promise<BusinessLocation[]> {  // ✅ تغيير
    try {
      const businessInfo = await this.getBusinessInfoById(id);
      return businessInfo.locations;
    } catch (error) {
      throw error;
    }
  }
}


export const publicApiService = new PublicApiService();
