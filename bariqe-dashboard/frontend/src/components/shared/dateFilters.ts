// تحديث handleCustomDateRange
export const handleCustomDateRange = (
  dateFilter: { from?: Date; to?: Date } | null, 
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  if (dateFilter && dateFilter.from && dateFilter.to) {
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

// تحديث search handlers
export const createProductSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue.startsWith("status:")) {
        const status = searchValue.replace("status:", "").toLowerCase();
        const isActive = status === "active";
        return changeFilterFn([["productStatus", "==", isActive]], "queries");
      } else if (searchValue.startsWith("code:")) {
        const code = searchValue.replace("code:", "");
        return changeFilterFn([["productCode", "contains", code]], "queries");
      } else if (searchValue.startsWith("name:")) {
        const name = searchValue.replace("name:", "");
        return changeFilterFn([["productNameAr", "contains", name]], "queries");
      
      } else if (searchValue.startsWith("form:")) {
        const form = searchValue.replace("form:", "");
        return changeFilterFn([["productForm", "==", form]], "queries");
      } else if (searchValue.startsWith("price:")) {
        const price = parseFloat(searchValue.replace("price:", ""));
        if (!isNaN(price)) {
          return changeFilterFn([["productPrice", "<=", price]], "queries");
        }
      } else {
        return changeFilterFn([
          [
            "$or",
            "custom",
            [
              ["productNameAr", "contains", searchValue],
              ["productNameEn", "contains", searchValue],
              ["productCode", "contains", searchValue],
         
            ],
          ],
        ], "queries");
      }
    }
  };
};

export const createCustomerSearchHandler = (
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
      const searchValue = (e.target as HTMLInputElement).value.trim();

      if (searchValue.startsWith("status:")) {
        const status = searchValue.replace("status:", "").toLowerCase();
        const isActive = status === "active";
        return changeFilterFn([["customerStatus", "==", isActive]], "queries");
      } else if (searchValue.startsWith("email:")) {
        const email = searchValue.replace("email:", "");
        return changeFilterFn([["customerEmail", "contains", email]], "queries");
      } else if (searchValue.startsWith("phone:")) {
        const phone = searchValue.replace("phone:", "");
        return changeFilterFn([["customerPhone", "contains", phone]], "queries");
      } else {
        return changeFilterFn([
          [
            "$or",
            "custom",
            [
              ["customerName", "contains", searchValue],
              ["customerEmail", "contains", searchValue],
              ["customerPhone", "contains", searchValue],
            ],
          ],
        ], "queries");
      }
    }
  };
};
export const handleDateFilters = (
  filterValue: string, 
  changeFilterFn: (queries: any[], type?: "queries" | "sorts") => void
) => {
  if (filterValue === "today") {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    changeFilterFn([
      ["createdAt", ">=", startOfDay.toISOString()],
      ["createdAt", "<=", endOfDay.toISOString()],
    ], "queries");
  } else if (filterValue === "thisweek") {
    const today = new Date();
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
  } else if (filterValue === "thismonth") {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    changeFilterFn([
      ["createdAt", ">=", startOfMonth.toISOString()],
      ["createdAt", "<=", endOfMonth.toISOString()],
    ], "queries");
  } else if (filterValue === "last30days") {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    changeFilterFn([
      ["createdAt", ">=", thirtyDaysAgo.toISOString()],
      ["createdAt", "<=", today.toISOString()],
    ], "queries");
  } else if (filterValue === "last3months") {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    changeFilterFn([
      ["createdAt", ">=", threeMonthsAgo.toISOString()],
      ["createdAt", "<=", today.toISOString()],
    ], "queries");
  } else {
    changeFilterFn([], "queries");
  }
};
