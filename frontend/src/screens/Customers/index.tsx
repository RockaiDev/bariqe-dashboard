import { useState } from "react";
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  Users,
  Pen,
  Plus,
  Trash,
  Download,
  Calendar,
  SquareArrowUpRight,
} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FormField } from "@/components/shared/FormField";
import { useCrud } from "@/hooks/useCrud";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";

import {
  createCustomerSearchHandler,
  handleCustomDateRange,
} from "@/components/shared/dateFilters";
import {
  createCustomerFilterGroups,
  handleCustomerFilters,
} from "@/components/shared/filters";

export interface Customer {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerNotes: string;
  customerSource: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CustomersPage() {
  const intl = useIntl();

  // Customer source options
  const customerSources = [
    { value: "order", label: intl.formatMessage({ id: "customers.source_order" }) },
    { value: "consultation", label: intl.formatMessage({ id: "customers.source_consultation" }) },
    { value: "material_request", label: intl.formatMessage({ id: "customers.source_material_request" }) },
    { value: "other", label: intl.formatMessage({ id: "customers.source_other" }) },
  ];

  // pagination & filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update, del } = useCrud("customers", filters);

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

  const customers: Customer[] = list.data?.result?.data || [];
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

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);

  // Edit state مع إضافة states للتأكيد
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [originalEditForm, setOriginalEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerNotes: "",
    customerSource: "",
  });
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerNotes: "",
    customerSource: "",
  });

  // التحقق من وجود تغييرات في Edit Form
  const isEditFormDirty =
    editForm.customerName !== originalEditForm.customerName ||
    editForm.customerEmail !== originalEditForm.customerEmail ||
    editForm.customerPhone !== originalEditForm.customerPhone ||
    editForm.customerAddress !== originalEditForm.customerAddress ||
    editForm.customerNotes !== originalEditForm.customerNotes ||
    editForm.customerSource !== originalEditForm.customerSource;

  const handleEdit = (c: Customer) => {
    setEditing(c);
    const formData = {
      customerName: c.customerName || "",
      customerEmail: c.customerEmail || "",
      customerPhone: c.customerPhone || "",
      customerAddress: c.customerAddress || "",
      customerNotes: c.customerNotes || "",
      customerSource: c.customerSource || "",
    };
    setEditForm(formData);
    setOriginalEditForm(formData);
    setEditOpen(true);
  };

  // دالة لمعالجة إغلاق Edit Dialog
  const handleEditOpenChange = (newOpen: boolean) => {
    if (!newOpen && isEditFormDirty) {
      setShowEditConfirmDialog(true);
    } else {
      setEditOpen(newOpen);
      if (!newOpen) {
        setEditing(null);
      }
    }
  };

  // دالة لتأكيد إغلاق Edit Dialog
  const confirmEditClose = () => {
    setEditForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerNotes: "",
      customerSource: "",
    });
    setOriginalEditForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerNotes: "",
      customerSource: "",
    });
    setEditOpen(false);
    setEditing(null);
    setShowEditConfirmDialog(false);
  };

  // دالة لإلغاء إغلاق Edit Dialog
  const cancelEditClose = () => {
    setShowEditConfirmDialog(false);
  };

  const handleView = (c: Customer) => {
    setViewing(c);
    setViewOpen(true);
  };

  // Get source label for display
  const getSourceLabel = (value: string) => {
    const source = customerSources.find((s) => s.value === value);
    return source ? source.label : value;
  };

  // Get source color for badges
  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      order: "bg-blue-100 text-blue-700",
      consultation: "bg-green-100 text-green-700",
      material_request: "bg-orange-100 text-orange-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[source] || "bg-gray-100 text-gray-700";
  };

  // Export Customers Function
  const handleExportCustomers = async () => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "customers.exporting_customers" }));
    try {
      const response = await axiosInstance.get("/customers/export/excel", {
        responseType: "blob",
      });
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        let parsedMessage = intl.formatMessage({ id: "customers.export_failed" });
        try {
          const parsed = JSON.parse(text);
          parsedMessage = parsed.message || parsedMessage;
        } catch {
          parsedMessage = text || parsedMessage;
        }
        throw new Error(parsedMessage);
      }

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "customers.customers_exported_success" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      let errMsg = error?.message || intl.formatMessage({ id: "customers.failed_to_export_customers" });
      try {
        if (
          error?.response?.data &&
          typeof error.response.data.text === "function"
        ) {
          const text = await error.response.data.text();
          try {
            const parsed = JSON.parse(text);
            errMsg = parsed.message || text || errMsg;
          } catch {
            errMsg = text || errMsg;
          }
        }
      } catch (e) {
        // ignore
      }
      toast.error(errMsg);
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

  const handleEditPhoneChange = (value: string | undefined) => {
    setEditForm((prev) => ({
      ...prev,
      customerPhone: value || "",
    }));
  };

  return (
    <div className="p-6 space-y-4 !font-tajawal" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-3 md:flex-row flex-col gap-3">
        <Title
          title={intl.formatMessage({ id: "customers.title" })}
          subtitle={intl.formatMessage({ id: "customers.subtitle" })}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* button export */}
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="w-4 h-4 ml-2" />
            {intl.formatMessage({ id: "customers.export_customers" })}
          </Button>

          <AddCustomer create={create} isLoading={create.isPending} />
        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "customers.all_customers_leads" })}
        icon={Users}
        loading={list.isLoading}
        isEmpty={!customers?.length}
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
          placeholder: intl.formatMessage({ id: "customers.search_placeholder" }),
          onKeyDown: createCustomerSearchHandler(ChangeFilter),
        }}
        filterGroups={createCustomerFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleCustomerFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">{intl.formatMessage({ id: "customers.hash" })}</TableHead>
            <SortableTH
              sortKey="customerName"
              label={intl.formatMessage({ id: "customers.name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="customerEmail"
              label={intl.formatMessage({ id: "customers.email" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="customerPhone"
              label={intl.formatMessage({ id: "customers.phone" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="customerSource"
              label={intl.formatMessage({ id: "customers.source" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "customers.created_date" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "customers.notes" })}</TableHead>
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "customers.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {customers.map((c: Customer, i: number) => (
              <TableRow
                key={c._id}
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
                onClick={() => handleView(c)}
              >
                <TableCell className="text-right">{i + 1}</TableCell>
                <TableCell className="font-medium text-black text-center">
                  {c.customerName}
                </TableCell>
                <TableCell className="text-center">{c.customerEmail}</TableCell>
                <TableCell className="text-center">{c.customerPhone}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-center text-xs font-medium mx-auto ${getSourceColor(
                      c.customerSource
                    )}`}
                  >
                    {getSourceLabel(c.customerSource)}
                  </span>
                </TableCell>
                <TableCell className="!text-center">
                  <div className="flex items-center gap-1 text-sm text-gray-600 text-center">
                    <Calendar className="w-3 h-3" />
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString("ar-SA")
                      : "-"}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-center">
                  {c.customerNotes || "-"}
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
                        handleEdit(c);
                      }}
                    >
                      <Pen />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(c);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash className="text-white" />
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
          className="sm:max-w-[600px]"
          aria-describedby="view-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "customers.customer_details" })}
            </DialogTitle>
            <DialogDescription id="view-dialog-description">
              {intl.formatMessage({ id: "customers.view_detailed_information" })}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "customers.customer_name" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.customerName}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "customers.email" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.customerEmail || intl.formatMessage({ id: "customers.not_provided" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "customers.phone" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.customerPhone || intl.formatMessage({ id: "customers.not_provided" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <SquareArrowUpRight className="w-4 h-4" />
                    {intl.formatMessage({ id: "customers.source" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceColor(
                        viewing.customerSource
                      )}`}
                    >
                      {getSourceLabel(viewing.customerSource)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "customers.address" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm">
                    {viewing.customerAddress || intl.formatMessage({ id: "customers.not_provided" })}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "customers.notes" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                  <p className="text-gray-800 leading-relaxed">
                    {viewing.customerNotes || intl.formatMessage({ id: "customers.no_notes_available" })}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "customers.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "customers.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "customers.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "customers.not_available" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "customers.customer_id" })}
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
            <div className="flex gap-2 w-full">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">
                  {intl.formatMessage({ id: "customers.close" })}
                </Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (viewing) {
                    setViewOpen(false);
                    handleEdit(viewing);
                  }
                }}
                className="flex-1 text-white"
              >
                <Pen className="w-4 h-4 ml-2" />
                {intl.formatMessage({ id: "customers.edit_customer" })}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog مع التأكيد */}
      <Dialog open={editOpen} onOpenChange={handleEditOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-[520px]"
          aria-describedby="edit-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "customers.edit_customer" })}</DialogTitle>
            <DialogDescription id="edit-dialog-description">
              {intl.formatMessage({ id: "customers.update_customer_information" })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing) return;

              if (editForm.customerPhone === "") {
                toast.error(intl.formatMessage({ id: "customers.please_enter_phone" }));
                return;
              }

              const canSubmit =
                editForm.customerName.trim() &&
                editForm.customerEmail.trim() &&
                editForm.customerPhone.trim() &&
                editForm.customerNotes.trim() &&
                editForm.customerSource.trim();

              if (!canSubmit) {
                toast.error(intl.formatMessage({ id: "customers.fill_required_fields" }));
                return;
              }

              update.mutate(
                {
                  id: editing._id,
                  payload: editForm,
                },
                {
                  onSuccess: () => {
                    toast.success(intl.formatMessage({ id: "customers.customer_updated_success" }));
                    setEditOpen(false);
                    setEditing(null);
                    setOriginalEditForm({
                      customerName: "",
                      customerEmail: "",
                      customerPhone: "",
                      customerAddress: "",
                      customerNotes: "",
                      customerSource: "",
                    });
                  },
                  onError: (error: any) => {
                    toast.error(
                      error?.response?.data?.message ||
                        intl.formatMessage({ id: "customers.failed_to_update_customer" })
                    );
                  },
                }
              );
            }}
          >
            <FormField
              id="edit_customerName"
              label={intl.formatMessage({ id: "customers.name_required" })}
              value={editForm.customerName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, customerName: e.target.value }))
              }
              required
            />
            <FormField
              id="edit_customerEmail"
              label={intl.formatMessage({ id: "customers.email_required" })}
              type="email"
              value={editForm.customerEmail}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, customerEmail: e.target.value }))
              }
              required
            />
            <FormField
              id="edit_customerPhone"
              label={intl.formatMessage({ id: "customers.phone_required" })}
              value={editForm.customerPhone}
              onChange={() => {}}
              onPhoneChange={handleEditPhoneChange}
              variant="phone"
              placeholder={intl.formatMessage({ id: "customers.enter_phone_number" })}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="edit_customerSource">{intl.formatMessage({ id: "customers.source_required" })}</Label>
              <Select
                value={editForm.customerSource}
                onValueChange={(value) =>
                  setEditForm((f) => ({ ...f, customerSource: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={intl.formatMessage({ id: "customers.select_source" })} />
                </SelectTrigger>
                <SelectContent>
                  {customerSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full">
              <FormField
                id="edit_customerAddress"
                label={intl.formatMessage({ id: "customers.address" })}
                value={editForm.customerAddress}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    customerAddress: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-span-full">
              <Label htmlFor="edit_customerNotes">{intl.formatMessage({ id: "customers.notes_required" })}</Label>
              <Textarea
                id="edit_customerNotes"
                value={editForm.customerNotes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, customerNotes: e.target.value }))
                }
                rows={3}
                className="mt-1"
                required
              />
            </div>

            <DialogFooter className="mt-4 col-span-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
              >
                {intl.formatMessage({ id: "customers.cancel" })}
              </Button>
              <Button
                type="submit"
                className="text-white"
                disabled={
                  !editForm.customerName ||
                  !editForm.customerEmail ||
                  !editForm.customerPhone ||
                  !editForm.customerNotes ||
                  !editForm.customerSource ||
                  update.isPending
                }
              >
                {update.isPending ? intl.formatMessage({ id: "customers.updating" }) : intl.formatMessage({ id: "customers.save_changes" })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog التأكيد للـ Edit */}
      <Dialog
        open={showEditConfirmDialog}
        onOpenChange={setShowEditConfirmDialog}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="edit-confirm-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "customers.confirm_close" })}</DialogTitle>
            <DialogDescription id="edit-confirm-dialog-description">
              {intl.formatMessage({ id: "customers.unsaved_changes_warning" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: "customers.unsaved_changes_question" })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEditClose}>
              {intl.formatMessage({ id: "customers.continue_editing" })}
            </Button>
            <Button
              variant="destructive"
              className="text-white"
              onClick={confirmEditClose}
            >
              {intl.formatMessage({ id: "customers.close_without_saving" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          setOpen={setDeleteOpen}
          itemName={toDelete?.customerName}
          onConfirm={() => {
            if (toDelete) del.mutate(toDelete._id);
            setDeleteOpen(false);
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}

// Add Customer Component مع التأكيد
function AddCustomer({
  create,
  isLoading,
}: {
  create: any;
  isLoading: boolean;
}) {
  const intl = useIntl();

  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerNotes: "",
    customerSource: "",
  });

  // Customer source options
  const customerSources = [
    { value: "order", label: intl.formatMessage({ id: "customers.source_order" }) },
    { value: "consultation", label: intl.formatMessage({ id: "customers.source_consultation" }) },
    { value: "material_request", label: intl.formatMessage({ id: "customers.source_material_request" }) },
    { value: "other", label: intl.formatMessage({ id: "customers.source_other" }) },
  ];

  // تتبع ما إذا كان النموذج يحتوي على بيانات
  const isFormDirty =
    form.customerName.trim() ||
    form.customerEmail.trim() ||
    form.customerPhone.trim() ||
    form.customerAddress.trim() ||
    form.customerNotes.trim() ||
    form.customerSource.trim();

  // إضافة دالة معالجة رقم الهاتف
  const handleAddPhoneChange = (value: string | undefined) => {
    setForm((prev) => ({
      ...prev,
      customerPhone: value || "",
    }));
  };

  // دالة لمعالجة إغلاق الـ Dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isFormDirty) {
      setShowConfirmDialog(true);
    } else {
      setOpen(newOpen);
    }
  };

  // دالة لتأكيد الإغلاق
  const confirmClose = () => {
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerNotes: "",
      customerSource: "",
    });
    setOpen(false);
    setShowConfirmDialog(false);
  };

  // دالة لإلغاء الإغلاق
  const cancelClose = () => {
    setShowConfirmDialog(false);
  };

  const canSubmit =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    form.customerPhone.trim() &&
    form.customerNotes.trim() &&
    form.customerSource.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogTrigger asChild>
          <Button className="text-white cursor-pointer">
            <Plus /> {intl.formatMessage({ id: "customers.new_customer" })}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[520px]"
          aria-describedby="add-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "customers.new_customer" })}</DialogTitle>
            <DialogDescription id="add-dialog-description">
              {intl.formatMessage({ id: "customers.add_new_customer_description" })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.customerPhone == "") {
                toast.error(intl.formatMessage({ id: "customers.please_enter_phone" }));
                return;
              }

              if (!canSubmit || isLoading) return;

              create.mutate(form, {
                onSuccess: () => {
                  setForm({
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    customerAddress: "",
                    customerNotes: "",
                    customerSource: "",
                  });
                  setOpen(false);
                  toast.success(intl.formatMessage({ id: "customers.customer_created_success" }));
                },
                onError: (error: any) => {
                  toast.error(
                    error?.result?.message || intl.formatMessage({ id: "customers.failed_to_create_customer" })
                  );
                },
              });
            }}
          >
            <FormField
              id="customerName"
              label={intl.formatMessage({ id: "customers.name_required" })}
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              required
            />
            <FormField
              id="customerEmail"
              label={intl.formatMessage({ id: "customers.email_required" })}
              type="email"
              value={form.customerEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerEmail: e.target.value }))
              }
              required
            />

            <FormField
              id="customerPhone"
              label={intl.formatMessage({ id: "customers.phone_required" })}
              value={form.customerPhone}
              onChange={() => {}}
              onPhoneChange={handleAddPhoneChange}
              variant="phone"
              placeholder={intl.formatMessage({ id: "customers.enter_phone_number" })}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="customerSource">{intl.formatMessage({ id: "customers.source_required" })}</Label>
              <Select
                value={form.customerSource}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, customerSource: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={intl.formatMessage({ id: "customers.select_source" })} />
                </SelectTrigger>
                <SelectContent>
                  {customerSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full">
              <FormField
                id="customerAddress"
                label={intl.formatMessage({ id: "customers.address" })}
                value={form.customerAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerAddress: e.target.value }))
                }
              />
            </div>

            <div className="col-span-full">
              <Label htmlFor="customerNotes">{intl.formatMessage({ id: "customers.notes_required" })}</Label>
              <Textarea
                id="customerNotes"
                value={form.customerNotes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerNotes: e.target.value }))
                }
                rows={3}
                className="mt-1"
                placeholder={intl.formatMessage({ id: "customers.notes_placeholder" })}
                required
              />
            </div>

            <DialogFooter className="mt-4 col-span-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {intl.formatMessage({ id: "customers.cancel" })}
              </Button>
              <Button
                type="submit"
                className="text-white"
                disabled={!canSubmit}
              >
                {isLoading ? intl.formatMessage({ id: "customers.creating" }) : intl.formatMessage({ id: "customers.create_customer" })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog التأكيد */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="add-confirm-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "customers.confirm_close" })}</DialogTitle>
            <DialogDescription id="add-confirm-dialog-description">
              {intl.formatMessage({ id: "customers.unsaved_data_warning" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: "customers.unsaved_changes_question" })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelClose}>
              {intl.formatMessage({ id: "customers.continue_adding" })}
            </Button>
            <Button
              variant="destructive"
              className="text-white"
              onClick={confirmClose}
            >
              {intl.formatMessage({ id: "customers.close_without_saving" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}