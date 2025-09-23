import { useState } from "react";
import { useIntl } from "react-intl";
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
// إضافة هذه imports
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
interface MaterialRequest {
  _id: string;
  materialName: string;
  materialEmail: string; // Note: keeping the typo from your schema
  materialPhone: string;
  materialQuantity: number;
  materialIntendedUse: string;
  materialActions?: "approve" | "denied" | "pending";
  createdAt?: string;
  updatedAt?: string;
}

const ACTION_OPTIONS = [
  { label: "material_requests.pending", value: "pending" },
  { label: "material_requests.approved", value: "approve" },
  { label: "material_requests.denied", value: "denied" },
];

export default function MaterialRequestPage() {
  const intl = useIntl();
  // pagination & filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update } = useCrud("materialRequests", filters);

  // Table Edit Status State - للتعديل من الجدول
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

  const materialRequests: MaterialRequest[] = list.data?.result?.data || [];
  const paginationData = list.data?.result?.pagination ?? {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
  };

  const pagination = {
    currentPage: paginationData.currentPage,
    perPage: paginationData.perPage,
    total: list.data?.result?.count || 0,
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
      // Clear sorting
      ChangeFilter([], "sorts");
    } else {
      // Set new sort
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportMaterialRequests}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {intl.formatMessage({ id: "material_requests.export_requests" })}
          </Button>

          {/* Add Material Request Button */}
          <AddMaterialRequest
            create={create.mutate}
            isLoading={create.isPending}
          />
        </div>
      </div>
      <DataTable
        title={intl.formatMessage({ id: "material_requests.requested_materials" })}
        icon={FileText}
        loading={list.isLoading}
        isEmpty={!materialRequests?.length}
        columnCount={7}
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
            <TableHead className=" text-right">#</TableHead>
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
                        {req.materialEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3" />
                      <span>{req.materialPhone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {req.materialQuantity.toLocaleString()}
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
                    ? new Date(req.createdAt).toLocaleDateString("en-US", {
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
                    <p className="font-medium">{viewing.materialEmail}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "material_requests.phone" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.materialPhone}</p>
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

// Add Material Request Dialog Component
// Add Material Request Dialog Component
function AddMaterialRequest({
  create,
  isLoading,
}: {
  create: (payload: any) => void;
  isLoading: boolean;
}) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    materialName: "",
    materialEmail: "",
    materialPhone: "",
    materialQuantity: 0,
    materialIntendedUse: "",
    materialActions: "pending" as "pending" | "approve" | "denied",
  });

  // Add Dialog Confirmation
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
    form.materialEmail.trim() &&
    form.materialPhone.trim() &&
    form.materialIntendedUse.trim() &&
    form.materialQuantity > 0;

  // Check if form has changes
  const hasFormChanges = () => {
    return (
      form.materialName !== "" ||
      form.materialEmail !== "" ||
      form.materialPhone !== "" ||
      form.materialQuantity !== 0 ||
      form.materialIntendedUse !== "" ||
      form.materialActions !== "pending"
    );
  };

  // Handle dialog close with confirmation
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
      materialActions: "pending",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    // Convert "pending" to undefined for the API and clean up form data
    const cleanForm = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => {
          if (typeof value === "string") return value.trim() !== "";
          return value !== null && value !== undefined;
        })
        .map(([key, value]) => [
          key,
          key === "materialActions" && value === "pending" ? undefined : value,
        ])
    );

    try {
      create(cleanForm);
      setForm({
        materialName: "",
        materialEmail: "",
        materialPhone: "",
        materialQuantity: 0,
        materialIntendedUse: "",
        materialActions: "pending",
      });
      setOpen(false);
      toast.success(intl.formatMessage({ id: "material_requests.request_created_success" }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          intl.formatMessage({ id: "material_requests.request_creation_failed" });
      toast.error(errorMessage);
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
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "material_requests.new_material_request" })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: "material_requests.create_request_description" })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
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

            <FormField
              id="materialEmail"
              label={intl.formatMessage({ id: "material_requests.email" })}
              type="email"
              value={form.materialEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, materialEmail: e.target.value }))
              }
              required
            />

            <FormField
              id="materialPhone"
              label={intl.formatMessage({ id: "material_requests.phone_number" })}
              variant="phone"
              onChange={(e) => {
                e;
              }}
              value={form.materialPhone}
              onPhoneChange={(value) =>
                setForm((f) => ({ ...f, materialPhone: value || "" }))
              }
              placeholder="Enter phone number"
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
                required
              />
            </div>

            <DialogFooter className="mt-4 col-span-full">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {intl.formatMessage({ id: "material_requests.cancel" })}
                </Button>
              </DialogClose>
              <Button type="submit" className="text-white" disabled={!canSubmit || isLoading}>
                {isLoading 
                  ? intl.formatMessage({ id: "material_requests.creating" }) 
                  : intl.formatMessage({ id: "material_requests.create_request" })
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Material Request Confirmation Dialog */}
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
