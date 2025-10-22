import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Country, State, City } from 'country-state-city';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Eye,
  FileText,
  Plus,
  Mail,
  Phone,
  Download,
  Edit2,
  X,
  MapPin,

  User,
} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // ✅ إضافة RadioGroup
import { Input } from "@/components/ui/input";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { FormField } from "@/components/shared/FormField";

import { Label } from "@/components/ui/label";
import { useCrud } from "@/hooks/useCrud";
import { handleCustomDateRange } from "@/components/shared/dateFilters";
import {
  createMaterialRequestFilterGroups,
  createMaterialRequestSearchHandler,
  handleMaterialRequestFilters,
} from "@/components/shared/filters";
import toast from "react-hot-toast";
import axiosInstance from "@/helper/axiosInstance";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useLanguage } from "@/context/LanguageContext";

interface MaterialRequest {
  _id: string;
  materialName: string;
  materialEmail: string;
  materialPhone: string;
  materialQuantity: number;
  materialIntendedUse: string;
  materialLocation?: string;
  materialActions?: "approve" | "denied" | "pending";
  customer?: {
    _id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerLocation?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface LocationData {
  country: string;
  state: string;
  city: string;
  countryCode: string;
  stateCode: string;
}

const ACTION_OPTIONS = [
  { label: "material_requests.pending", value: "pending" },
  { label: "material_requests.approved", value: "approve" },
  { label: "material_requests.denied", value: "denied" },
];

export default function MaterialRequestPage() {
  const intl = useIntl();
   const { isRTL } = useLanguage();
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update } = useCrud("materialRequests", filters);
  const { list: customersList, create: createCustomer } = useCrud("customers");

  // Table Edit Status State
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [tableEditStatus, setTableEditStatus] = useState<string>("");

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

  const materialRequests: MaterialRequest[] = list.data?.data || [];
  const allCustomers: any = customersList.data?.data || [];
  const customers = allCustomers.filter((customer: any) => customer.customerSource === "material_request");

  const paginationData = list.data?.pagination ?? {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
  };

  const pagination = {
    currentPage: paginationData.currentPage,
    perPage: paginationData.perPage,
    total: list.data?.count || 0,
    lastPage: paginationData.totalPages,
  };

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<MaterialRequest | null>(null);

  const handleView = (req: MaterialRequest) => {
    setViewing(req);
    setViewOpen(true);
  };

  // Helper function to get status badge
  const getStatusBadge = (action?: string) => {
    if (!action || action === "pending") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg">
          {intl.formatMessage({ id: "material_requests.pending" })}
        </span>
      );
    }

    if (action === "approve") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 border border-green-300 rounded-lg">
          {intl.formatMessage({ id: "material_requests.approved" })}
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 border border-red-300 rounded-lg">
        {intl.formatMessage({ id: "material_requests.denied" })}
      </span>
    );
  };

  // Handle Status Edit in Table
  const handleTableStatusClick = (
    e: React.MouseEvent,
    requestId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    setEditingRequestId(requestId);
    setTableEditStatus(currentStatus || "pending");
  };

  const handleTableStatusChange = async (
    requestId: string,
    newStatus: string
  ) => {
    try {
      await update.mutateAsync({
        id: requestId,
        payload: { materialActions: newStatus },
      });

      list.refetch();
      setEditingRequestId(null);
      setTableEditStatus("");
      toast.success(intl.formatMessage({ id: "material_requests.status_updated_success" }));
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: "material_requests.failed_to_update_status" }));
      setEditingRequestId(null);
      setTableEditStatus("");
    }
  };

  const handleCancelTableEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRequestId(null);
    setTableEditStatus("");
  };

  const handleExportMaterialRequests = async () => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "material_requests.exporting_requests" }));

    try {
      const response = await axiosInstance.get("/materialRequests/export", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const blob = new Blob([response.data]);
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Export failed");
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `material_requests_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "material_requests.requests_exported_success" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || intl.formatMessage({ id: "material_requests.export_failed" }));
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
          title={intl.formatMessage({ id: "material_requests.title" })}
          subtitle={intl.formatMessage({ id: "material_requests.subtitle" })}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportMaterialRequests}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {intl.formatMessage({ id: "material_requests.export_requests" })}
          </Button>

          <AddMaterialRequest
            create={create.mutate}
            createCustomer={createCustomer}
            isLoading={create.isPending}
            customers={customers}
          />
        </div>
      </div>

      {/* باقي الكود نفسه... */}
      <DataTable
        title={intl.formatMessage({ id: "material_requests.requested_materials" })}
        icon={FileText}
        loading={list.isLoading}
        isEmpty={!materialRequests?.length}
        columnCount={8}
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
          placeholder: intl.formatMessage({ id: "material_requests.search_placeholder" }),
          onKeyDown: createMaterialRequestSearchHandler(ChangeFilter),
        }}
        filterGroups={createMaterialRequestFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleMaterialRequestFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">#</TableHead>
            <SortableTH
              sortKey="materialName"
              label={intl.formatMessage({ id: "material_requests.material_name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "material_requests.contact_info" })}</TableHead>
            <SortableTH
              sortKey="materialQuantity"
              label={intl.formatMessage({ id: "material_requests.quantity" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="materialLocation"
              label={intl.formatMessage({ id: "material_requests.location" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "material_requests.intended_use" })}</TableHead>
            <SortableTH
              sortKey="materialActions"
              label={intl.formatMessage({ id: "material_requests.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "material_requests.created" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "material_requests.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {materialRequests.map((req, i) => (
              <TableRow
                key={req._id}
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
                onClick={() => handleView(req)}
              >
                <TableCell className="text-right">{(pagination.currentPage - 1) * pagination.perPage + i + 1}</TableCell>
                <TableCell className="font-medium text-black">
                  {req.materialName}
                </TableCell>
                <TableCell className="text-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">
                        {req.customer?.customerEmail || req.materialEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3" />
                      <span>{req.customer?.customerPhone || req.materialPhone}</span>
                    </div>
                    {req.customer && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[150px] font-medium">
                          {req.customer.customerName}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {req.materialQuantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-sm">
                      {req.materialLocation || req.customer?.customerLocation || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {req.materialIntendedUse}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingRequestId === req._id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={tableEditStatus}
                        onValueChange={(value) =>
                          handleTableStatusChange(req._id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{intl.formatMessage({ id: "material_requests.pending" })}</SelectItem>
                          <SelectItem value="approve">{intl.formatMessage({ id: "material_requests.approved" })}</SelectItem>
                          <SelectItem value="denied">{intl.formatMessage({ id: "material_requests.denied" })}</SelectItem>
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
                        handleTableStatusClick(
                          e,
                          req._id,
                          req.materialActions || "pending"
                        )
                      }
                    >
                      <span className="cursor-pointer">
                        {getStatusBadge(req.materialActions)}
                      </span>
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString(    isRTL ? "ar-EG" : "en-US",
                        {
                          year: "2-digit",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
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
                        handleView(req);
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

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
          aria-describedby="view-request-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "material_requests.material_request_details" })}
            </DialogTitle>
            <DialogDescription id="view-request-dialog-description">
              {intl.formatMessage({ id: "material_requests.view_request_description" })}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.material_name" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.materialName}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.material_quantity" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-bold text-lg text-blue-600">
                      {viewing.materialQuantity.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.email" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      {viewing.customer?.customerEmail || viewing.materialEmail}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.phone" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      {viewing.customer?.customerPhone || viewing.materialPhone}
                    </p>
                  </div>
                </div>

                {viewing.customer && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {intl.formatMessage({ id: "material_requests.customer_name" })}
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="font-medium">{viewing.customer.customerName}</p>
                    </div>
                  </div>
                )}

                {/* ✅ عرض منفصل لـ Customer Location و Material Location */}
                {viewing.customer?.customerLocation && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {intl.formatMessage({ id: "material_requests.customer_location" })}
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{viewing.customer.customerLocation}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {intl.formatMessage({ id: "material_requests.material_location" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.materialLocation || intl.formatMessage({ id: "material_requests.not_provided" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.status" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {getStatusBadge(viewing.materialActions)}
                  </div>
                </div>
              </div>

              {/* Intended Use */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "material_requests.intended_use" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                  <p className="text-gray-800 leading-relaxed">
                    {viewing.materialIntendedUse}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString()
                        : intl.formatMessage({ id: "material_requests.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString()
                        : intl.formatMessage({ id: "material_requests.not_available" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "material_requests.request_id" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm font-mono text-gray-600">
                    {viewing._id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                {intl.formatMessage({ id: "material_requests.close" })}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ✅ تحديث Add Material Request Dialog Component مع RadioGroup
function AddMaterialRequest({
  create,
  createCustomer,
  // isLoading,
  customers,
}: {
  create: (payload: any) => void;
  createCustomer: any;
  isLoading: boolean;
  customers: any[];
}) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ✅ تغيير لاستخدام RadioGroup بدلاً من Checkbox
  const [customerMode, setCustomerMode] = useState<"new" | "existing">("existing");

  const [form, setForm] = useState({
    materialName: "",
    materialEmail: "",
    materialPhone: "",
    materialQuantity: 0,
    materialIntendedUse: "",
    materialLocation: "", // ✅ موقع الطلب منفصل
    materialActions: "pending" as "pending" | "approve" | "denied",
    customer: "",
  });

  // ✅ نموذج إنشاء العميل الجديد
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerNotes: "",
    customerSource: "material_request",
    customerAddress: "",
    customerLocation: "",
  });

  // ✅ موقع الطلب منفصل عن موقع العميل
  const [materialLocationData, setMaterialLocationData] = useState<LocationData>({
    country: "",
    state: "",
    city: "",
    countryCode: "",
    stateCode: "",
  });

  // ✅ موقع العميل (للعميل الجديد فقط)
  const [customerLocationData, setCustomerLocationData] = useState<LocationData>({
    country: "",
    state: "",
    city: "",
    countryCode: "",
    stateCode: "",
  });

  const addConfirmDialog = useConfirmationDialog({
    onConfirm: () => {
      setOpen(false);
      resetForm();
    },
    onCancel: () => {
      // Stay in dialog
    }
  });

  const canSubmit =
    form.materialName.trim() &&
 
    form.materialQuantity > 0 &&
    (customerMode === "new" ? 
      (customerForm.customerName.trim() && 
       customerForm.customerPhone.trim() && 
       customerForm.customerAddress.trim()) :
      (form.customer.trim() || (form.materialEmail.trim() && form.materialPhone.trim()))
    );

  const hasFormChanges = () => {
    return (
      form.materialName !== "" ||
      form.materialQuantity !== 0 ||
      form.materialIntendedUse === "" ||
      form.materialLocation !== "" ||
      form.materialActions !== "pending" ||
      form.customer !== "" ||
      (customerMode === "existing" && (form.materialEmail !== "" || form.materialPhone !== "")) ||
      (customerMode === "new" && (
        customerForm.customerName !== "" ||
        customerForm.customerEmail !== "" ||
        customerForm.customerPhone !== "" ||
        customerForm.customerNotes !== "" ||
        customerForm.customerAddress !== "" ||
        customerForm.customerLocation !== ""
      ))
    );
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && hasFormChanges()) {
      addConfirmDialog.showDialog();
    } else {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      materialName: "",
      materialEmail: "",
      materialPhone: "",
      materialQuantity: 0,
      materialIntendedUse: "",
      materialLocation: "",
      materialActions: "pending",
      customer: "",
    });
    setCustomerForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNotes: "",
      customerSource: "material_request",
      customerAddress: "",
      customerLocation: "",
    });
    setMaterialLocationData({
      country: "",
      state: "",
      city: "",
      countryCode: "",
      stateCode: "",
    });
    setCustomerLocationData({
      country: "",
      state: "",
      city: "",
      countryCode: "",
      stateCode: "",
    });
    setCustomerMode("existing");
  };

  // ✅ Handle phone change (فقط للعميل الجديد)
  const handlePhoneChange = (value: string | undefined) => {
    if (customerMode === "new") {
      setCustomerForm((prev) => ({
        ...prev,
        customerPhone: value || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        materialPhone: value || "",
      }));
    }
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      let customerId = form.customer;

      // إنشاء customer جديد إذا كان مطلوب
      if (customerMode === "new") {
        if (
          !customerForm.customerName ||
          !customerForm.customerPhone ||
          !customerForm.customerAddress
        ) {
          toast.error(intl.formatMessage({ id: "material_requests.fill_required_fields" }));
          return;
        }

        try {
          const customerResponse: any = await createCustomer.mutateAsync(customerForm);
          customerId = customerResponse?.result?._id || customerResponse?._id;

          if (!customerId) {
            toast.error(intl.formatMessage({ id: "material_requests.failed_customer_creation" }));
            return;
          }

          toast.success(intl.formatMessage({ id: "material_requests.customer_created_success" }));
        } catch (customerError: any) {
          console.error("Customer creation error:", customerError);
          const errorMessage = customerError?.response?.data?.message || 
                              customerError?.message || 
                              intl.formatMessage({ id: "material_requests.failed_customer_creation" });
          toast.error(errorMessage);
          return;
        }
      }

      // ✅ إنشاء material request مع materialLocation منفصل
      const requestData = {
        materialName: form.materialName,
        materialQuantity: form.materialQuantity,
        materialIntendedUse: form.materialIntendedUse || "",
        materialLocation: form.materialLocation, // ✅ موقع الطلب منفصل
        materialActions: form.materialActions === "pending" ? undefined : form.materialActions,
        customer: customerId || undefined,
        // ✅ إذا لم يكن هناك customer، استخدم materialEmail و materialPhone
        materialEmail: !customerId ? form.materialEmail : undefined,
        materialPhone: !customerId ? form.materialPhone : undefined,
      };

      // إزالة الحقول الفارغة
      const cleanForm = Object.fromEntries(
        Object.entries(requestData)
          .filter(([, value]) => {
            if (typeof value === "string") return value.trim() !== "";
            return value !== null && value !== undefined;
          })
      );

      await create(cleanForm);
      resetForm();
      setOpen(false);
      toast.success(intl.formatMessage({ id: "material_requests.request_created_success" }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "material_requests.request_creation_failed" });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="text-white cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> {intl.formatMessage({ id: "material_requests.new_request" })}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "material_requests.new_material_request" })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: "material_requests.create_request_description" })}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ Customer Mode Selection با RadioGroup */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {intl.formatMessage({ id: "material_requests.customer_selection" })}
              </Label>
              
              <RadioGroup
                value={customerMode}
                onValueChange={(value: "new" | "existing") => {
                  setCustomerMode(value);
                  // ✅ إعادة تعيين الحقول عند التغيير
                  setForm(prev => ({ ...prev, customer: "", materialEmail: "", materialPhone: "" }));
                  setCustomerForm({
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    customerNotes: "",
                    customerSource: "material_request",
                    customerAddress: "",
                    customerLocation: "",
                  });
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing" className="cursor-pointer">
                    {intl.formatMessage({ id: "material_requests.select_existing_customer" })}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="cursor-pointer">
                    {intl.formatMessage({ id: "material_requests.create_new_customer" })}
                  </Label>
                </div>
              </RadioGroup>

              {/* ✅ Customer Selection - إما اختيار موجود أو إنشاء جديد */}
              {customerMode === "existing" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "material_requests.select_customer" })}</Label>
                    <Select
                      value={form.customer}
                      onValueChange={(value) => {
                        setForm((prev) => ({ 
                          ...prev, 
                          customer: value,
                          // ✅ مسح email و phone عند اختيار customer
                          materialEmail: "",
                          materialPhone: ""
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={intl.formatMessage({ id: "material_requests.choose_customer" })} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            {customer.customerName} - {customer.customerEmail}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ✅ Fallback fields - فقط إذا لم يتم اختيار customer */}
                  {!form.customer && (
                    <>
                      {/* <FormField
                        id="materialEmail"
                        label={intl.formatMessage({ id: "material_requests.email" })}
                        type="email"
                        value={form.materialEmail}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, materialEmail: e.target.value }))
                        }
                        required={!form.customer}
                      />
                      <FormField
                        id="materialPhone"
                        label={intl.formatMessage({ id: "material_requests.phone_number" })}
                        variant="phone"
                        onChange={(e) => {e;}}
                        value={form.materialPhone}
                        onPhoneChange={handlePhoneChange}
                        placeholder="Enter phone number"
                        required={!form.customer}
                      /> */}
                    </>
                  )}
                </div>
              ) : (
                // ✅ New Customer Form
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "material_requests.customer_name_required" })}</Label>
                    <Input
                      value={customerForm.customerName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "material_requests.enter_customer_name" })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "material_requests.email" })}</Label>
                    <Input
                      type="email"
                      value={customerForm.customerEmail}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "material_requests.email_placeholder" })}
                    />
                  </div>
                  <FormField
                    id="customerPhone"
                    label={intl.formatMessage({ id: "material_requests.phone_required" })}
                    value={customerForm.customerPhone}
                    onChange={(e) => {e;}}
                    onPhoneChange={handlePhoneChange}
                    variant="phone"
                    placeholder={intl.formatMessage({ id: "material_requests.enter_phone" })}
                    required
                  />
                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "material_requests.address_required" })}</Label>
                    <Input
                      value={customerForm.customerAddress}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerAddress: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "material_requests.customer_address" })}
                      required
                    />
                  </div>

                  {/* ✅ Customer Location Selector (للعميل الجديد فقط) */}
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {intl.formatMessage({ id: "material_requests.customer_location" })}
                      </Label>
            
                    </div>

                    <LocationSelector
                      locationData={customerLocationData}
                      setLocationData={setCustomerLocationData}
                      setForm={setCustomerForm}
                      intl={intl}
                      fieldPrefix="customer"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "material_requests.notes" })}</Label>
                    <Input
                      value={customerForm.customerNotes}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerNotes: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "material_requests.additional_notes" })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Material Location Selector (منفصل للطلب نفسه) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {intl.formatMessage({ id: "material_requests.material_location" })}
                </Label>
             
              </div>

              <LocationSelector
                locationData={materialLocationData}
                setLocationData={setMaterialLocationData}
                setForm={setForm}
                intl={intl}
                fieldPrefix="material"
              />
            </div>

            {/* Material Request Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="materialName"
                label={intl.formatMessage({ id: "material_requests.material_name" })}
                value={form.materialName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, materialName: e.target.value }))
                }
                required
              />

              <FormField
                id="materialQuantity"
                label={intl.formatMessage({ id: "material_requests.quantity" })}
                type="number"
                min="1"
                value={form.materialQuantity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    materialQuantity: parseInt(e.target.value) || 0,
                  }))
                }
                required
              />

              {/* Action Status Selector */}
              <div className="space-y-2 col-span-full">
                <Label htmlFor="materialActions">{intl.formatMessage({ id: "material_requests.initial_status" })}</Label>
                <Select
                  value={form.materialActions}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, materialActions: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={intl.formatMessage({ id: "material_requests.select_status" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {intl.formatMessage({ id: action.label })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-full">
                <FormField
                  id="materialIntendedUse"
                  label={intl.formatMessage({ id: "material_requests.intended_use_description" })}
                  variant="textarea"
                  rows={4}
                  value={form.materialIntendedUse}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, materialIntendedUse: e.target.value }))
                  }
                 
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  {intl.formatMessage({ id: "material_requests.cancel" })}
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="text-white" 
                disabled={!canSubmit || loading}
              >
                {loading 
                  ? intl.formatMessage({ id: "material_requests.creating" }) 
                  : customerMode === "new"
                  ? intl.formatMessage({ id: "material_requests.create_customer_request" })
                  : intl.formatMessage({ id: "material_requests.create_request" })
                }
              </Button>
            </DialogFooter>
          </form>
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
    </>
  );
}

// Location Selector Component (نفس الكود السابق)
function LocationSelector({ 
  locationData, 
  setLocationData, 
  setForm, 
  intl,
  fieldPrefix = "customer"
}: { 
  locationData: LocationData; 
  setLocationData: (data: LocationData) => void; 
  setForm: any; 
  intl: any;
  fieldPrefix?: string;
}) {
  const [countries] = useState(() => Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    if (locationData.countryCode) {
      const countryStates = State.getStatesOfCountry(locationData.countryCode);
      setStates(countryStates);
      
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

  useEffect(() => {
    if (locationData.countryCode && locationData.stateCode) {
      const stateCities = City.getCitiesOfState(locationData.countryCode, locationData.stateCode);
      setCities(stateCities);
      
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

  useEffect(() => {
    if (locationData.city || locationData.stateCode || locationData.countryCode) {
      const locationString = `${locationData.city}, ${locationData.stateCode}, ${locationData.countryCode}`;
      setForm((prev: any) => ({
        ...prev,
        [`${fieldPrefix}Location`]: locationString
      }));
    }
  }, [locationData, fieldPrefix]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "material_requests.country" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "material_requests.select_country" })} />
          </SelectTrigger>
          <SelectContent className="!overflow-y-auto max-h-60">
            {countries.map((country) => (
              <SelectItem key={country.isoCode} value={country.isoCode}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "material_requests.state" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "material_requests.select_state" })} />
          </SelectTrigger>
          <SelectContent className="!overflow-y-auto max-h-60">
            {states.map((state) => (
              <SelectItem key={state.isoCode} value={state.isoCode}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{intl.formatMessage({ id: "material_requests.city" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "material_requests.select_city" })} />
          </SelectTrigger>
          <SelectContent className="!overflow-y-auto max-h-60">
            {cities.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {locationData.city && (
        <div className="col-span-full">
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-600">
              <strong>{intl.formatMessage({ id: "material_requests.selected_location" })}:</strong> {locationData.city}, {locationData.state}, {locationData.country}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>{intl.formatMessage({ id: "material_requests.location_code" })}:</strong> {locationData.city}, {locationData.stateCode}, {locationData.countryCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}