// types.ts
export type FilterHandler = (
  filterKey: string,
  filterValue: string,
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => void;

export type DateFilter = { from?: Date; to?: Date } | null;

interface Category {
  _id: string;
  categoryNameEn: string;
  categoryNameAr: string;
}

// utils/dateFilters.ts
export const handleDateFilters = (
  filterValue: string, 
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  const today = new Date();
  
  switch (filterValue) {
    case "today": {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      changeFilterFn([
        ["createdAt", ">=", startOfDay.toISOString()],
        ["createdAt", "<=", endOfDay.toISOString()],
      ], "queries");
      break;
    }
    
    case "thisweek": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      changeFilterFn([
        ["createdAt", ">=", startOfWeek.toISOString()],
        ["createdAt", "<=", endOfWeek.toISOString()],
      ], "queries");
      break;
    }
    
    case "thismonth": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      changeFilterFn([
        ["createdAt", ">=", startOfMonth.toISOString()],
        ["createdAt", "<=", endOfMonth.toISOString()],
      ], "queries");
      break;
    }
    
    case "last30days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      changeFilterFn([
        ["createdAt", ">=", thirtyDaysAgo.toISOString()],
        ["createdAt", "<=", endDate.toISOString()],
      ], "queries");
      break;
    }
    
    case "last3months": {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      changeFilterFn([
        ["createdAt", ">=", threeMonthsAgo.toISOString()],
        ["createdAt", "<=", endDate.toISOString()],
      ], "queries");
      break;
    }
    
    default:
      changeFilterFn([], "queries");
  }
};

export const handleCustomDateRange = (
  dateFilter: DateFilter, 
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  if (dateFilter?.from && dateFilter?.to) {
    const startDate = new Date(dateFilter.from);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateFilter.to);
    endDate.setHours(23, 59, 59, 999);
    
    changeFilterFn([
      ["createdAt", ">=", startDate.toISOString()],
      ["createdAt", "<=", endDate.toISOString()],
    ], "queries");
  } else {
    changeFilterFn([], "queries");
  }
};

// filters/productFilters.ts
export const handleProductFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "status":
      if (filterValue === "active") {
        changeFilterFn([["productStatus", "==", true]], "queries");
      } else if (filterValue === "inactive") {
        changeFilterFn([["productStatus", "==", false]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "grade":
      const gradeMap: Record<string, string> = {
        "technical": "Technical",
        "analytical": "Analytical",
        "usp": "USP",
        "fcc": "FCC",
        "cosmetic": "Cosmetic Grade"
      };
      
      if (filterValue !== "all" && gradeMap[filterValue]) {
        changeFilterFn([["productGrade", "==", gradeMap[filterValue]]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "form":
      const formMap: Record<string, string> = {
        "solid": "Solid",
        "liquid": "Liquid",
        "gas": "Gas",
        "powder": "Powder",
        "granular": "Granular"
      };
      
      if (filterValue !== "all" && formMap[filterValue]) {
        changeFilterFn([["productForm", "==", formMap[filterValue]]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "category":
      if (filterValue !== "all") {
        changeFilterFn([["productCategory", "==", filterValue]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};


export const createProductFilterGroups = (categories: Category[], t: (key: string) => string, isRTL: boolean = false) => [



  {
    label: t("filters.status"),
    key: "status",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.active"), value: "active" },
      { label: t("filters.inactive"), value: "inactive" },
    ],
  },
  {
    label: t("filters.grade"),
    key: "grade",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.technical"), value: "technical" },
      { label: t("filters.analytical"), value: "analytical" },
      { label: t("filters.usp"), value: "usp" },
      { label: t("filters.fcc"), value: "fcc" },
      { label: t("filters.cosmetic"), value: "cosmetic" },
    ],
  },
  {
    label: t("filters.form"),
    key: "form",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.solid"), value: "solid" },
      { label: t("filters.liquid"), value: "liquid" },
      { label: t("filters.gas"), value: "gas" },
      { label: t("filters.powder"), value: "powder" },
      { label: t("filters.granular"), value: "granular" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
  {
    label: t("filters.category"),
    key: "category",
    options: [
      { label: t("filters.all"), value: "all" },
      ...categories.map((cat :any)=> ({ 
        label: isRTL ? (cat.categoryNameAr || cat.categoryName) : (cat.categoryNameEn || cat.categoryName), 
        value: cat._id 
      })),
    ],
  },
];

// filters/orderFilters.ts
export const handleOrderFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "status":
      const statusMap: Record<string, string> = {
        "pending": "pending",
        "shipped": "shipped", 
        "delivered": "delivered",
        "cancelled": "cancelled"
      };
      
      if (filterValue !== "all" && statusMap[filterValue]) {
        changeFilterFn([["orderStatus", "==", statusMap[filterValue]]], "queries"); // Fixed typo: orderStatus -> orderStatus
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "quantity":
      if (filterValue === "low") {
        changeFilterFn([["quantity", "<=", 5]], "queries");
      } else if (filterValue === "medium") {
        changeFilterFn([
          ["quantity", ">", 5],
          ["quantity", "<=", 20]
        ], "queries");
      } else if (filterValue === "high") {
        changeFilterFn([["quantity", ">", 20]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "price":
      if (filterValue === "low") {
        changeFilterFn([["product.productPrice", "<=", 100]], "queries");
      } else if (filterValue === "medium") {
        changeFilterFn([
          ["product.productPrice", ">", 100],
          ["product.productPrice", "<=", 500]
        ], "queries");
      } else if (filterValue === "high") {
        changeFilterFn([["product.productPrice", ">", 500]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};

export const createOrderFilterGroups = (t: (key: string) => string) => [
  {
    label: t("filters.status"),
    key: "status",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.pending"), value: "pending" },
      { label: t("filters.shipped"), value: "shipped" },
      { label: t("filters.delivered"), value: "delivered" },
      { label: t("filters.cancelled"), value: "cancelled" },
    ],
  },
  {
    label: t("filters.quantity"),
    key: "quantity",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.low_quantity"), value: "low" },
      { label: t("filters.medium_quantity"), value: "medium" },
      { label: t("filters.high_quantity"), value: "high" },
    ],
  },
  {
    label: t("filters.price_range"),
    key: "price",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.low_price"), value: "low" },
      { label: t("filters.medium_price"), value: "medium" },
      { label: t("filters.high_price"), value: "high" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
];



// filters/materialRequestFilters.ts
export const handleMaterialRequestFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "status":
      if (filterValue === "pending") {
        changeFilterFn([["materialActions", "==", "pending"]], "queries");
      } else if (filterValue === "approved") {
        changeFilterFn([["materialActions", "==", "approve"]], "queries");
      } else if (filterValue === "denied") {
        changeFilterFn([["materialActions", "==", "denied"]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "quantity":
      if (filterValue === "low") {
        changeFilterFn([["materialQuantity", "<=", 100]], "queries");
      } else if (filterValue === "medium") {
        changeFilterFn([
          ["materialQuantity", ">", 100],
          ["materialQuantity", "<=", 1000]
        ], "queries");
      } else if (filterValue === "high") {
        changeFilterFn([["materialQuantity", ">", 1000]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};

export const createMaterialRequestFilterGroups = (t: (key: string) => string) => [
  {
    label: t("filters.status"),
    key: "status",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.pending"), value: "pending" },
      { label: t("filters.approved"), value: "approved" },
      { label: t("filters.denied"), value: "denied" },
    ],
  },
  {
    label: t("filters.quantity_range"),
    key: "quantity",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.low_quantity_range"), value: "low" },
      { label: t("filters.medium_quantity_range"), value: "medium" },
      { label: t("filters.high_quantity_range"), value: "high" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
];

// filters/categoryFilters.ts
export const handleCategoryFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "status":
      if (filterValue === "active") {
        changeFilterFn([["categoryStatus", "==", true]], "queries");
      } else if (filterValue === "inactive") {
        changeFilterFn([["categoryStatus", "==", false]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};

export const createCategoryFilterGroups = (t: (key: string) => string) => [
  {
    label: t("filters.status"),
    key: "status",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.active"), value: "active" },
      { label: t("filters.inactive"), value: "inactive" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
];

// search/searchHandlers.ts
export const createOrderSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue) {
        if (searchValue.startsWith("status:")) {
          const status = searchValue.replace("status:", "").toLowerCase();
          return changeFilterFn([["orderStatus", "==", status]], "queries");
        } else if (searchValue.startsWith("customer:")) {
          const customerName = searchValue.replace("customer:", "");
          return changeFilterFn([["customer.customerName", "contains", customerName]], "queries");
        } else if (searchValue.startsWith("product:")) {
          const productName = searchValue.replace("product:", "");
          return changeFilterFn([["product.productName", "contains", productName]], "queries");
        } else if (searchValue.startsWith("email:")) {
          const email = searchValue.replace("email:", "");
          return changeFilterFn([["customer.customerEmail", "contains", email]], "queries");
        } else if (searchValue.startsWith("phone:")) {
          const phone = searchValue.replace("phone:", "");
          return changeFilterFn([["customer.customerPhone", "contains", phone]], "queries");
        } else if (searchValue.startsWith("quantity:")) {
          const quantity = parseInt(searchValue.replace("quantity:", ""));
          if (!isNaN(quantity)) {
            return changeFilterFn([["quantity", ">=", quantity]], "queries");
          }
        } else if (searchValue.startsWith("total:")) {
          const total = parseFloat(searchValue.replace("total:", ""));
          if (!isNaN(total)) {
            return changeFilterFn([["product.productPrice", ">=", total]], "queries");
          }
        } else {
          return changeFilterFn([
            [
              "$or",
              "custom",
              [
                ["customer.customerName", "contains", searchValue],
                ["customer.customerEmail", "contains", searchValue],
                ["product.productNameAr", "contains", searchValue],
                
                ["product.productNameEn", "contains", searchValue],
              ],
            ],
          ], "queries");
        }
      } else {
        changeFilterFn([], "queries");
      }
    }
  };
};

export const createMaterialRequestSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue) {
        if (searchValue.startsWith("status:")) {
          const status = searchValue.replace("status:", "").toLowerCase();
          if (status === "pending") {
            return changeFilterFn([["materialActions", "==", null]], "queries");
          } else if (status === "approved") {
            return changeFilterFn([["materialActions", "==", "approve"]], "queries");
          } else if (status === "denied") {
            return changeFilterFn([["materialActions", "==", "denied"]], "queries");
          }
        } else if (searchValue.startsWith("email:")) {
          const email = searchValue.replace("email:", "");
          return changeFilterFn([["materialEmail", "contains", email]], "queries"); // Fixed typo: materialEmail -> materialEmail
        } else if (searchValue.startsWith("phone:")) {
          const phone = searchValue.replace("phone:", "");
          return changeFilterFn([["materialPhone", "contains", phone]], "queries");
        } else if (searchValue.startsWith("material:")) {
          const material = searchValue.replace("material:", "");
          return changeFilterFn([["materialName", "contains", material]], "queries");
        } else if (searchValue.startsWith("quantity:")) {
          const quantity = parseInt(searchValue.replace("quantity:", ""));
          if (!isNaN(quantity)) {
            return changeFilterFn([["materialQuantity", ">=", quantity]], "queries");
          }
        } else {
          return changeFilterFn([
            [
              "$or",
              "custom",
              [
                ["materialName", "contains", searchValue],
                ["materialEmail", "contains", searchValue], // Fixed typo
                ["materialPhone", "contains", searchValue],
                ["materialIntendedUse", "contains", searchValue],
              ],
            ],
          ], "queries");
        }
      } else {
        changeFilterFn([], "queries");
      }
    }
  };
};

export const createCategorySearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue) {
        if (searchValue.startsWith("status:")) {
          const status = searchValue.replace("status:", "").toLowerCase();
          const isActive = status === "active";
          return changeFilterFn([["categoryStatus", "==", isActive]], "queries");
        } else if (searchValue.startsWith("name:")) {
          const name = searchValue.replace("name:", "");
          return changeFilterFn([["categoryName", "contains", name]], "queries");
        } else if (searchValue.startsWith("desc:")) {
          const desc = searchValue.replace("desc:", "");
          return changeFilterFn([["categoryDescription", "contains", desc]], "queries");
        } else {
          return changeFilterFn([
            [
              "$or",
              "custom",
              [
                ["categoryName", "contains", searchValue],
                ["categoryDescription", "contains", searchValue],
              ],
            ],
          ], "queries");
        }
      } else {
        changeFilterFn([], "queries");
      }
    }
  };
};


// filters/consultationRequestFilters.ts
export const handleConsultationRequestFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "status":
      const statusMap: Record<string, string> = {
        "new": "new",
        "contacted": "contacted", 
        "closed": "closed"
      };
      
      if (filterValue !== "all" && statusMap[filterValue]) {
        changeFilterFn([["ConsultationRequestsStatus", "==", statusMap[filterValue]]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "customerStatus":
      // This checks if a customer exists for this consultation
      if (filterValue === "existing") {
        // You'll need to implement this logic based on your customer checking
        changeFilterFn([["customerExists", "==", true]], "queries");
      } else if (filterValue === "potential") {
        changeFilterFn([["customerExists", "==", false]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};

export const createConsultationRequestFilterGroups = (t: (key: string) => string) => [
  {
    label: t("filters.status"),
    key: "status",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.new"), value: "new" },
      { label: t("filters.contacted"), value: "contacted" },
      { label: t("filters.closed"), value: "closed" },
    ],
  },
  {
    label: t("filters.customer_status"),
    key: "customerStatus",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.existing_customer"), value: "existing" },
      { label: t("filters.potential_customer"), value: "potential" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
];

export const createConsultationRequestSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue) {
        if (searchValue.startsWith("status:")) {
          const status = searchValue.replace("status:", "").toLowerCase();
          return changeFilterFn([["ConsultationRequestsStatus", "==", status]], "queries");
        } else if (searchValue.startsWith("name:")) {
          const name = searchValue.replace("name:", "");
          return changeFilterFn([["ConsultationRequestsName", "contains", name]], "queries");
        } else if (searchValue.startsWith("email:")) {
          const email = searchValue.replace("email:", "");
          return changeFilterFn([["ConsultationRequestsEmail", "contains", email]], "queries");
        } else if (searchValue.startsWith("phone:")) {
          const phone = searchValue.replace("phone:", "");
          return changeFilterFn([["ConsultationRequestsPhone", "contains", phone]], "queries");
        } else if (searchValue.startsWith("area:")) {
          const area = searchValue.replace("area:", "");
          return changeFilterFn([["consultationRequestsArea", "contains", area]], "queries");
        } else if (searchValue.startsWith("message:")) {
          const message = searchValue.replace("message:", "");
          return changeFilterFn([["ConsultationRequestsMessage", "contains", message]], "queries");
        } else {
          return changeFilterFn([
            [
              "$or",
              "custom",
              [
                ["ConsultationRequestsName", "contains", searchValue],
                ["ConsultationRequestsEmail", "contains", searchValue],
                ["ConsultationRequestsPhone", "contains", searchValue],
                ["consultationRequestsArea", "contains", searchValue],
                ["ConsultationRequestsMessage", "contains", searchValue],
              ],
            ],
          ], "queries");
        }
      } else {
        changeFilterFn([], "queries");
      }
    }
  };
};
// filters/customerFilters.ts
export const handleCustomerFilters: FilterHandler = (filterKey, filterValue, changeFilterFn) => {
  switch (filterKey) {
    case "source":
      const sourceMap: Record<string, string> = {
        "order": "order",
        "consultation": "consultation",
        "material_request": "material request",
        "other": "Other"
      };
      
      if (filterValue !== "all" && sourceMap[filterValue]) {
        changeFilterFn([["customerSource", "==", sourceMap[filterValue]]], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "hasAddress":
      if (filterValue === "with_address") {
        changeFilterFn([["customerAddress", "!=", ""]], "queries");
      } else if (filterValue === "without_address") {
        changeFilterFn([
          ["$or", "custom", [
            ["customerAddress", "==", ""],
            ["customerAddress", "==", null]
          ]]
        ], "queries");
      } else {
        changeFilterFn([], "queries");
      }
      break;
      
    case "date":
      handleDateFilters(filterValue, changeFilterFn);
      break;
      
    default:
      changeFilterFn([], "queries");
  }
};

export const createCustomerFilterGroups = (t: (key: string) => string) => [
  {
    label: t("filters.source"),
    key: "source",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.order"), value: "order" },
      { label: t("filters.consultation"), value: "consultation" },
      { label: t("filters.material_request"), value: "material_request" },
      { label: t("filters.other"), value: "other" },
    ],
  },
  {
    label: t("filters.address"),
    key: "hasAddress",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.with_address"), value: "with_address" },
      { label: t("filters.without_address"), value: "without_address" },
    ],
  },
  {
    label: t("filters.date"),
    key: "date",
    options: [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.today"), value: "today" },
      { label: t("filters.this_week"), value: "thisweek" },
      { label: t("filters.this_month"), value: "thismonth" },
      { label: t("filters.last_30_days"), value: "last30days" },
      { label: t("filters.last_3_months"), value: "last3months" },
    ],
  },
];

export const createCustomerSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue) {
        if (searchValue.startsWith("source:")) {
          const source = searchValue.replace("source:", "").toLowerCase();
          return changeFilterFn([["customerSource", "==", source]], "queries");
        } else if (searchValue.startsWith("name:")) {
          const name = searchValue.replace("name:", "");
          return changeFilterFn([["customerName", "contains", name]], "queries");
        } else if (searchValue.startsWith("email:")) {
          const email = searchValue.replace("email:", "");
          return changeFilterFn([["customerEmail", "contains", email]], "queries");
        } else if (searchValue.startsWith("phone:")) {
          const phone = searchValue.replace("phone:", "");
          return changeFilterFn([["customerPhone", "contains", phone]], "queries");
        } else if (searchValue.startsWith("address:")) {
          const address = searchValue.replace("address:", "");
          return changeFilterFn([["customerAddress", "contains", address]], "queries");
        } else if (searchValue.startsWith("notes:")) {
          const notes = searchValue.replace("notes:", "");
          return changeFilterFn([["customerNotes", "contains", notes]], "queries");
        } else {
          return changeFilterFn([
            [
              "$or",
              "custom",
              [
                ["customerName", "contains", searchValue],
                ["customerEmail", "contains", searchValue],
                ["customerPhone", "contains", searchValue],
                ["customerSource", "contains", searchValue],
                ["customerAddress", "contains", searchValue],
                ["customerNotes", "contains", searchValue],
              ],
            ],
          ], "queries");
        }
      } else {
        changeFilterFn([], "queries");
      }
    }
  };
}
