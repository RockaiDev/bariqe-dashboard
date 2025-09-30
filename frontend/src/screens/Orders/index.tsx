import { useState, useEffect } from "react";
import { useIntl } from 'react-intl';
import { Country, State, City } from 'country-state-city'; // ✅ إضافة المكتبة
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  Package,
  User,
  Calendar,
  Plus,
  Edit2,
  Check,
  X,
  Download,
  MapPin, // ✅ إضافة أيقونة MapPin

} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { useCrud } from "@/hooks/useCrud";
import { toast } from "react-hot-toast";
import { FormField } from "@/components/shared/FormField";
import { handleCustomDateRange } from "@/components/shared/dateFilters";
import {
  createOrderFilterGroups,
  createOrderSearchHandler,
  handleOrderFilters,
} from "@/components/shared/filters";
import axiosInstance from "@/helper/axiosInstance";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

interface Order {
  _id: string;
  customer: {
    _id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  product: {
    _id: string;
    productNameAr: string;
    productNameEn: string;
    productPrice: number;
  };
  quantity: number;
  orderQuantity: string;
  orderDiscount: number;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

// ✅ إضافة interface للموقع
interface LocationData {
  country: string;
  state: string;
  city: string;
  countryCode: string;
  stateCode: string;
}

export default function OrdersPage() {
  const intl = useIntl();

  // pagination & filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 15,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update } = useCrud("orders", filters);
  console.log(list);
  const { list: customersList, create: createCustomer } = useCrud("customers");
  const { list: productsList } = useCrud("products");
console.log("productsList:", productsList);
  // Add Order Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Status State
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editedStatus, setEditedStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Table Edit Status State - للتعديل من الجدول
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tableEditStatus, setTableEditStatus] = useState<string>("");

  // Form State
  const [orderForm, setOrderForm] = useState({
    customer: "",
    product: "", // منتج واحد فقط
    quantity: 1, // كمية المنتج
    orderQuantity: "1",
    orderDiscount: 0,
    orderStatus: "pending" as const,
  });

  // ✅ تحديث customerForm لإضافة customerLocation
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerNotes: "",
    customerSource: "order",
    customerAddress: "",
    customerLocation: "", // ✅ إضافة customerLocation
  });

  // ✅ إضافة state للموقع
  const [locationData, setLocationData] = useState<LocationData>({
    country: "",
    state: "",
    city: "",
    countryCode: "",
    stateCode: "",
  });

  const ChangeFilter = (
    newQueries: any[],
    type: "queries" | "sorts" = "queries"
  ) => {
    setFilters((f) => ({
      ...f,
      [type]: newQueries,
      page: 1,
    }));
  };

  const orders: Order[] = list.data?.data || [];
  console.log("orders:", orders);
  const allCustomers: any = customersList.data?.data || [];
  console.log("allCustomers:", allCustomers);

  const customers = allCustomers.filter((customer: any) => customer.customerSource === "order");
  const products = productsList?.data?.data || [];
      console.log("products:", products);

  const paginationData = list.data?.pagination ?? {
    currentPage: 1,
    perPage: 15,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
  };
  console.log("paginationData:", paginationData);

  const pagination = {
    currentPage: paginationData.currentPage,
    perPage: paginationData.perPage,
    total: list.data?.count || 0,
    lastPage: paginationData.totalPages,
  };

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Order | null>(null);

  const handleView = (order: Order) => {
    setViewing(order);
    setViewOpen(true);
    setIsEditingStatus(false);
    setEditedStatus("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg";
      case "processing":
        return "bg-blue-100 text-blue-700 border border-blue-300 rounded-lg";
      case "shipped":
        return "bg-purple-100 text-purple-700 border border-purple-300 rounded-lg";
      case "delivered":
        return "bg-green-100 text-green-700 border border-green-300 rounded-lg";
      case "cancelled":
        return "bg-red-100 text-red-700 border border-red-300 rounded-lg";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300 rounded-lg";
    }
  };

  const calculateOrderTotal = (order: Order) => {
    const subtotal = order.quantity * order.product.productPrice;
    return subtotal - order.orderDiscount;
  };

  // Get product details by ID
  const getProductById = (productId: string) => {
    return products.find((p: any) => p._id === productId);
  };

  // Handle phone change
  const handlePhoneChange = (value: string | undefined) => {
    setCustomerForm((prev) => ({
      ...prev,
      customerPhone: value || "",
    }));
  };



  // Handle Status Edit in View Dialog
  const handleEditStatus = () => {
    if (viewing) {
      setIsEditingStatus(true);
      setEditedStatus(viewing.orderStatus);
    }
  };

  const handleCancelEditStatus = () => {
    setIsEditingStatus(false);
    setEditedStatus("");
  };
  const addConfirmDialog = useConfirmationDialog({
    onConfirm: () => {
      setAddOpen(false);
      resetForms();
    },
    onCancel: () => {
      // يمكن إضافة أي منطق إضافي هنا
    }
  });

  // Edit Dialog Confirmation
  const editConfirmDialog = useConfirmationDialog({
    onConfirm: () => {
      setViewOpen(false);
      setViewing(null);
      setIsEditingStatus(false);
      setEditedStatus("");
    },
    onCancel: () => {
      // يمكن إضافة أي منطق إضافي هنا
    }
  });

  // Handle close dialogs with confirmation
  const handleAddDialogClose = (open: boolean) => {
    if (!open && hasAddFormChanges()) {
      addConfirmDialog.showDialog();
    } else {
      setAddOpen(false);
      resetForms();
    }
  };

  const handleViewDialogClose = (open: boolean) => {
    if (!open && hasEditFormChanges()) {
      editConfirmDialog.showDialog();
    } else {
      setViewOpen(false);
      setViewing(null);
      setIsEditingStatus(false);
      setEditedStatus("");
    }
  };
  const handleSaveStatus = async () => {
    if (!viewing || !editedStatus) return;

    try {
      setUpdatingStatus(true);

      const response = await update.mutateAsync({
        id: viewing._id,
        payload: { orderStatus: editedStatus },
      });
      console.log("Update response:", response);
      
      setViewing({
        ...viewing,
        orderStatus: editedStatus as Order["orderStatus"],
      });

      setIsEditingStatus(false);
      list.refetch();
      
      toast.success(intl.formatMessage({ id: "orders.status_updated_success" }));
    } catch (error: any) {
      console.error("Update status error:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "orders.failed_to_update_status" });
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Status Edit in Table
  const handleTableStatusClick = (
    e: React.MouseEvent,
    orderId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    setEditingOrderId(orderId);
    setTableEditStatus(currentStatus);
  };

  const handleTableStatusChange = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      const response = await update.mutateAsync({
        id: orderId,
        payload: { orderStatus: newStatus },
      });

      console.log("Update response:", response);

      list.refetch();
      setEditingOrderId(null);
      setTableEditStatus("");
      
      toast.success(intl.formatMessage({ id: "orders.status_updated_success" }));
    } catch (error: any) {
      console.error("Update table status error:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "orders.failed_to_update_status" });
      toast.error(errorMessage);
      setEditingOrderId(null);
      setTableEditStatus("");
    }
  };

  const handleCancelTableEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrderId(null);
    setTableEditStatus("");
  };

  // ✅ تحديث Check if form has changes لإضافة customerLocation
  const hasAddFormChanges = () => {
    return (
      orderForm.customer !== "" ||
      orderForm.product !== "" ||
      orderForm.quantity !== 1 ||
      orderForm.orderDiscount !== 0 ||
      orderForm.orderStatus !== "pending" ||
      (createNewCustomer && (
        customerForm.customerName !== "" ||
        customerForm.customerEmail !== "" ||
        customerForm.customerPhone !== "" ||
        customerForm.customerNotes !== "" ||
        customerForm.customerAddress !== "" ||
        customerForm.customerLocation !== "" // ✅ إضافة customerLocation
      ))
    );
  };

  const hasEditFormChanges = () => {
    return editedStatus !== "" && viewing && editedStatus !== viewing.orderStatus;
  };

  // Add Order Functions
  const handleAddOrder = async () => {
    try {
      setLoading(true);

      let customerId = orderForm.customer;

      if (createNewCustomer) {
        if (
          !customerForm?.customerName ||
          !customerForm.customerPhone ||
          !customerForm.customerAddress ||
          !customerForm.customerSource
        ) {
          toast.error(intl.formatMessage({ id: "orders.fill_required_fields" }));
          return;
        }

        try {
          const customerResponse: any = await createCustomer.mutateAsync(
            customerForm
          );

          customerId = customerResponse?.result?._id || customerResponse?._id;

          if (!customerId) {
            toast.error(intl.formatMessage({ id: "orders.failed_customer_creation" }));
            return;
          }

          toast.success(intl.formatMessage({ id: "orders.customer_created_success" }));
        } catch (customerError: any) {
          console.error("Customer creation error:", customerError);
          const errorMessage = customerError?.response?.data?.message || 
                              customerError?.message || 
                              intl.formatMessage({ id: "orders.failed_customer_creation" });
          toast.error(errorMessage);
          return;
        }
      }

      if (!customerId || !orderForm.product) {
        toast.error(intl.formatMessage({ id: "orders.select_customer_product" }));
        return;
      }

      const orderData = {
        customer: customerId,
        product: orderForm.product,
        quantity: orderForm.quantity,
        orderQuantity: orderForm.quantity.toString(),
        orderDiscount: orderForm.orderDiscount,
        orderStatus: orderForm.orderStatus,
      };

      await create.mutateAsync(orderData);

      setAddOpen(false);
      resetForms();
      list.refetch();
      
      toast.success(intl.formatMessage({ id: "orders.order_created_success" }));
    } catch (error: any) {
      console.error("Order creation error:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "orders.order_creation_failed" });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ تحديث resetForms لإضافة customerLocation و locationData
  const resetForms = () => {
    setOrderForm({
      customer: "",
      product: "",
      quantity: 1,
      orderQuantity: "1",
      orderDiscount: 0,
      orderStatus: "pending",
    });
    setCustomerForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNotes: "",
      customerSource: "order",
      customerAddress: "",
      customerLocation: "", // ✅ إضافة customerLocation
    });
    setLocationData({ // ✅ إضافة reset للموقع
      country: "",
      state: "",
      city: "",
      countryCode: "",
      stateCode: "",
    });
    setCreateNewCustomer(false);
  };

  const handleExportOrders = async () => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "orders.exporting_orders" }));

    try {
      const response = await axiosInstance.get("/orders/export", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const blob = new Blob([response.data]);
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || intl.formatMessage({ id: "orders.export_failed" }));
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "orders.orders_exported_success" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "orders.export_failed" });
      toast.error(errorMessage);
      console.error("Export error:", error);
    }
  };

  const currentSort =
    filters.sorts.length > 0
      ? {
          key: filters.sorts[0].field,
          direction: filters.sorts[0].direction,
        }
      : undefined;

  const handleSortChange = (key?: string, direction?: "asc" | "desc") => {
    if (!key || !direction) {
      ChangeFilter([], "sorts");
    } else {
      ChangeFilter([{ field: key, direction }], "sorts");
    }
  };

  return (
    <div className="p-6 space-y-4 !font-tajawal" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-3 md:flex-row flex-col gap-3">
        <Title 
          title={intl.formatMessage({ id: "orders.title" })} 
          subtitle={intl.formatMessage({ id: "orders.subtitle" })} 
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportOrders}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {intl.formatMessage({ id: "orders.export_orders" })}
          </Button>

          {/* Add Order Button */}
          <Button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" />
            {intl.formatMessage({ id: "orders.add_order" })}
          </Button>
        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "orders.all_orders" })}
        icon={Package}
        loading={list.isLoading}
        isEmpty={!orders?.length}
        columnCount={9}
        pagination={pagination}
        dateFilterAble={true}
        sort={currentSort}
        onSortChange={handleSortChange}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        onPerPageChange={(perPage) => setFilters((f) => ({ ...f, perPage, page: 1 }))}
        onDateFilterChange={(dateFilter) => {
          handleCustomDateRange(dateFilter, ChangeFilter);
        }}
        searchProps={{
          placeholder: intl.formatMessage({ id: "orders.search_placeholder" }),
          onKeyDown: createOrderSearchHandler(ChangeFilter),
        }}
        filterGroups={createOrderFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleOrderFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">{intl.formatMessage({ id: "orders.hash" })}</TableHead>
            <SortableTH
              sortKey="orderId"
              label={intl.formatMessage({ id: "orders.order_id" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="customerName"
              label={intl.formatMessage({ id: "orders.customer" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="productName"
              label={intl.formatMessage({ id: "orders.product" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="quantity"
              label={intl.formatMessage({ id: "orders.quantity" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="totalPrice"
              label={intl.formatMessage({ id: "orders.price" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="discount"
              label={intl.formatMessage({ id: "orders.discount" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="orderStatus"
              label={intl.formatMessage({ id: "orders.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "orders.date" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "orders.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {orders.map((order, i) => (
              <TableRow
                key={order._id}
                className={`
                  ${getRowColor(i)} 
                  cursor-pointer 
                  hover:bg-blue-50 
                  transition-colors 
                  duration-150 
                  border-b 
                  border-gray-200
                  sub-title-cgrey
                `}
                onClick={() => handleView(order)}
              >
                <TableCell className="text-right">{i + 1}</TableCell>
                <TableCell className="font-medium text-black font-mono text-sm">
                  {order._id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer?.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer?.customerEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                {intl.locale === "ar"
                    ? order?.product?.productNameAr
                    : order?.product?.productNameEn}
                </TableCell>

                <TableCell className="">{order.quantity}</TableCell>
                <TableCell className="font-medium">
                  {calculateOrderTotal(order).toFixed(2)}  EGP
                </TableCell>
                <TableCell className="">{order.orderDiscount}%</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingOrderId === order._id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={tableEditStatus}
                        onValueChange={(value) =>
                          handleTableStatusChange(order._id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{intl.formatMessage({ id: "orders.pending" })}</SelectItem>
                          <SelectItem value="shipped">{intl.formatMessage({ id: "orders.shipped" })}</SelectItem>
                          <SelectItem value="delivered">{intl.formatMessage({ id: "orders.delivered" })}</SelectItem>
                          <SelectItem value="cancelled">{intl.formatMessage({ id: "orders.cancelled" })}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelTableEdit}
                        className="p-1 h-8"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="inline-flex items-center gap-1 group"
                      onClick={(e) =>
                        handleTableStatusClick(e, order._id, order.orderStatus)
                      }
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize cursor-pointer ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {intl.formatMessage({ id: `orders.${order.orderStatus}` })}
                      </span>
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("ar-SA", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center gap-2 justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(order);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </>
        )}
      />

      {/* ✅ Add Order Dialog مع Location Selector */}
      <Dialog open={addOpen} onOpenChange={handleAddDialogClose}>
        <DialogContent
          className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
          aria-describedby="add-order-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {intl.formatMessage({ id: "orders.add_new_order" })}
            </DialogTitle>
          </DialogHeader>
          <div id="add-order-dialog-description" className="sr-only">
            {intl.formatMessage({ id: "orders.add_order_description" })}
          </div>

          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="new-customer"
                  className="text-white"
                  checked={createNewCustomer}
                  onCheckedChange={(checked) =>
                    setCreateNewCustomer(checked as boolean)
                  }
                />
                <Label htmlFor="new-customer" className="cursor-pointer">
                  {intl.formatMessage({ id: "orders.create_new_customer" })}
                </Label>
              </div>

              {createNewCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "orders.customer_name_required" })}</Label>
                    <Input
                      value={customerForm?.customerName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "orders.enter_customer_name" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "orders.email" })}</Label>
                    <Input
                      type="email"
                      value={customerForm.customerEmail}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "orders.email_placeholder" })}
                    />
                  </div>
                  <FormField
                    id="customerPhone"
                    label={intl.formatMessage({ id: "orders.phone_required" })}
                    value={customerForm.customerPhone}
                    onChange={(e) => {
                      e;
                    }}
                    onPhoneChange={handlePhoneChange}
                    variant="phone"
                    placeholder={intl.formatMessage({ id: "orders.enter_phone" })}
                    required
                  />
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "orders.source_required" })}</Label>
                    <Select
                      value={customerForm.customerSource}
                      onValueChange={(value) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerSource: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={intl.formatMessage({ id: "orders.select_source" })} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">{intl.formatMessage({ id: "customers.source_order" })}</SelectItem>
                        <SelectItem value="consultation">{intl.formatMessage({ id: "customers.source_consultation" })}</SelectItem>
                        <SelectItem value="material_request">{intl.formatMessage({ id: "customers.source_material_request" })}</SelectItem>
                        <SelectItem value="other">{intl.formatMessage({ id: "customers.source_other" })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "orders.address_required" })}</Label>
                    <Input
                      value={customerForm.customerAddress}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerAddress: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "orders.customer_address" })}
                      required
                    />
                  </div>

                  {/* ✅ Location Selector */}
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {intl.formatMessage({ id: "customers.location" })}
                      </Label>
                      {/* <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        {intl.formatMessage({ id: "customers.get_current_location" })}
                      </Button> */}
                    </div>

                    <LocationSelector
                      locationData={locationData}
                      setLocationData={setLocationData}
                      setForm={setCustomerForm}
                      intl={intl}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "orders.notes" })}</Label>
                    <Input
                      value={customerForm.customerNotes}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerNotes: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "orders.additional_notes" })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{intl.formatMessage({ id: "orders.select_customer_required" })}</Label>
                  <Select
                    value={orderForm.customer}
                    onValueChange={(value) =>
                      setOrderForm((prev) => ({ ...prev, customer: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={intl.formatMessage({ id: "orders.choose_customer" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer?.customerName} - {customer.customerEmail}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "orders.product_required" })}</Label>
                <Select
                  value={orderForm.product}
                  onValueChange={(value) =>
                    setOrderForm((prev) => ({ ...prev, product: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={intl.formatMessage({ id: "orders.select_product" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product._id} value={product._id}>
                        {intl.locale === "ar"   
                          ? product.productNameAr
                          : product.productNameEn} - ${product.productPrice.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "orders.quantity_required" })}</Label>
                <Input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) =>
                    setOrderForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "orders.discount_amount" })}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderForm.orderDiscount}
                  onChange={(e) =>
                    setOrderForm((prev) => ({
                      ...prev,
                      orderDiscount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "orders.order_status" })}</Label>
                <Select
                  value={orderForm.orderStatus}
                  onValueChange={(value: any) =>
                    setOrderForm((prev) => ({ ...prev, orderStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{intl.formatMessage({ id: "orders.pending" })}</SelectItem>
                    <SelectItem value="shipped">{intl.formatMessage({ id: "orders.shipped" })}</SelectItem>
                    <SelectItem value="delivered">{intl.formatMessage({ id: "orders.delivered" })}</SelectItem>
                    <SelectItem value="cancelled">{intl.formatMessage({ id: "orders.cancelled" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Summary */}
            {orderForm.product && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">{intl.formatMessage({ id: "orders.order_summary" })}</h4>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const product = getProductById(orderForm.product);
                    if (!product) return null;

                    const subtotal = product.productPrice * orderForm.quantity;
                    const total = subtotal - orderForm.orderDiscount;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>
                            {product.productName} × {orderForm.quantity}
                          </span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between">
                          <span>{intl.formatMessage({ id: "orders.subtotal" })}:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>{intl.formatMessage({ id: "orders.discount" })}:</span>
                          <span>-${orderForm.orderDiscount.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>{intl.formatMessage({ id: "orders.total" })}:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                {intl.formatMessage({ id: "orders.cancel" })}
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddOrder}
              disabled={loading}
              className="text-white"
            >
              {loading
                ? intl.formatMessage({ id: "orders.creating" })
                : createNewCustomer
                ? intl.formatMessage({ id: "orders.create_customer_order" })
                : intl.formatMessage({ id: "orders.create_order" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {intl.formatMessage({ id: "orders.order_details" })}
            </DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "orders.order_id" })}
                  </Label>
                  <p className="font-mono text-sm">#{viewing._id}</p>
                </div>
                <div className="space-y-1 flex flex-col justify-center items-center">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "orders.status" })}
                  </Label>
                  {isEditingStatus ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={editedStatus}
                        onValueChange={setEditedStatus}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{intl.formatMessage({ id: "orders.pending" })}</SelectItem>
                          <SelectItem value="shipped">{intl.formatMessage({ id: "orders.shipped" })}</SelectItem>
                          <SelectItem value="delivered">{intl.formatMessage({ id: "orders.delivered" })}</SelectItem>
                          <SelectItem value="cancelled">{intl.formatMessage({ id: "orders.cancelled" })}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveStatus}
                        disabled={updatingStatus}
                        className="p-1"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditStatus}
                        disabled={updatingStatus}
                        className="p-1"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          viewing.orderStatus
                        )}`}
                      >
                        {intl.formatMessage({ id: `orders.${viewing.orderStatus}` })}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditStatus}
                        className="p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "orders.order_date" })}
                  </Label>
                  <p className="text-sm">
                    {viewing.createdAt
                      ? new Date(viewing.createdAt).toLocaleString("ar-SA")
                      : intl.formatMessage({ id: "orders.not_available" })}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {intl.formatMessage({ id: "orders.customer_information" })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "orders.name" })}
                    </Label>
                    <p className="font-medium">
                      {viewing.customer?.customerName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "orders.email" })}
                    </Label>
                    <p className="text-sm">{viewing.customer.customerEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "orders.phone" })}
                    </Label>
                    <p className="text-sm">{viewing.customer.customerPhone}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "orders.customer_id" })}
                    </Label>
                    <p className="text-sm font-mono">{viewing.customer._id}</p>
                  </div>
                </div>
              </div>

              {/* Order Product */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{intl.formatMessage({ id: "orders.order_item" })}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                          {intl.formatMessage({ id: "orders.product" })}
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                          {intl.formatMessage({ id: "orders.quantity" })}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                          {intl.formatMessage({ id: "orders.price" })}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                          {intl.formatMessage({ id: "orders.total" })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              {intl.locale === "ar"
                                ? viewing.product?.productNameAr
                                : viewing.product?.productNameEn}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {viewing.product._id}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {viewing.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {viewing.product.productPrice.toFixed(2)} EGP
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                         
                          {(
                            viewing.product.productPrice * viewing.quantity
                          ).toFixed(2)} EGP
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{intl.formatMessage({ id: "orders.order_summary" })}</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>{intl.formatMessage({ id: "orders.subtotal" })}:</span>
                    <span className="font-medium">
                      $
                      {(
                        viewing.product.productPrice * viewing.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{intl.formatMessage({ id: "orders.discount" })}:</span>
                    <span className="font-medium">
                      -${viewing.orderDiscount.toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{intl.formatMessage({ id: "orders.total" })}:</span>
                    <span>${calculateOrderTotal(viewing).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{intl.formatMessage({ id: "orders.total_quantity" })}:</span>
                    <span>{viewing.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "orders.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "orders.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "orders.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "orders.not_available" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                {intl.formatMessage({ id: "orders.close" })}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <ConfirmationDialog
        open={addConfirmDialog.isOpen}
        onOpenChange={addConfirmDialog.setIsOpen}
        variant="add"
        onConfirm={addConfirmDialog.handleConfirm}
        onCancel={addConfirmDialog.handleCancel}
        isDestructive={true}
      />

      {/* Edit Status Confirmation Dialog */}
      <ConfirmationDialog
        open={editConfirmDialog.isOpen}
        onOpenChange={editConfirmDialog.setIsOpen}
        variant="edit"
        onConfirm={editConfirmDialog.handleConfirm}
        onCancel={editConfirmDialog.handleCancel}
        isDestructive={true}
      />
    </div>
  );
}

// ✅ Location Selector Component
function LocationSelector({ 
  locationData, 
  setLocationData, 
  setForm, 
  intl 
}: { 
  locationData: LocationData; 
  setLocationData: (data: LocationData) => void; 
  setForm: any; 
  intl: any; 
}) {
  const [countries] = useState(() => Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Update states when country changes
  useEffect(() => {
    if (locationData.countryCode) {
      const countryStates = State.getStatesOfCountry(locationData.countryCode);
      setStates(countryStates);
      
      // Reset state and city if country changed
      if (locationData.stateCode && !countryStates.find(s => s.isoCode === locationData.stateCode)) {
        setLocationData({
          ...locationData,
          state: "",
          stateCode: "",
          city: "",
        });
        setCities([]);
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [locationData.countryCode]);

  // Update cities when state changes
  useEffect(() => {
    if (locationData.countryCode && locationData.stateCode) {
      const stateCities = City.getCitiesOfState(locationData.countryCode, locationData.stateCode);
      setCities(stateCities);
      
      // Reset city if state changed
      if (locationData.city && !stateCities.find(c => c.name === locationData.city)) {
        setLocationData({
          ...locationData,
          city: "",
        });
      }
    } else {
      setCities([]);
    }
  }, [locationData.stateCode]);

  // Update form when location data changes
  useEffect(() => {
    if (locationData.city || locationData.stateCode || locationData.countryCode) {
      const locationString = `${locationData.city}, ${locationData.stateCode}, ${locationData.countryCode}`;
      setForm((prev: any) => ({
        ...prev,
        customerLocation: locationString
      }));
    }
  }, [locationData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Country Selection */}
      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "customers.country" })}</Label>
        <Select
          value={locationData.countryCode}
          onValueChange={(value) => {
            const country = countries.find(c => c.isoCode === value);
            if (country) {
              setLocationData({
                country: country.name,
                state: "",
                city: "",
                countryCode: country.isoCode,
                stateCode: "",
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={intl.formatMessage({ id: "customers.select_country" })} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.isoCode} value={country.isoCode}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State Selection */}
      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "customers.state" })}</Label>
        <Select
          value={locationData.stateCode}
          onValueChange={(value) => {
            const state = states.find(s => s.isoCode === value);
            if (state) {
              setLocationData({
                ...locationData,
                state: state.name,
                stateCode: state.isoCode,
                city: "",
              });
            }
          }}
          disabled={!locationData.countryCode}
        >
          <SelectTrigger>
            <SelectValue placeholder={intl.formatMessage({ id: "customers.select_state" })} />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.isoCode} value={state.isoCode}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "customers.city" })}</Label>
        <Select
          value={locationData.city}
          onValueChange={(value) => {
            setLocationData({
              ...locationData,
              city: value,
            });
          }}
          disabled={!locationData.stateCode}
        >
          <SelectTrigger>
            <SelectValue placeholder={intl.formatMessage({ id: "customers.select_city" })} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display selected location */}
      {locationData.city && (
        <div className="col-span-full">
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-600">
              <strong>{intl.formatMessage({ id: "customers.selected_location" })}:</strong> {locationData.city}, {locationData.state}, {locationData.country}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>{intl.formatMessage({ id: "customers.location_code" })}:</strong> {locationData.city}, {locationData.stateCode}, {locationData.countryCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}