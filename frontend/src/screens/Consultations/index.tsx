import { useState } from "react";
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  MessageSquare,
  Calendar,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  Mail,
  User,
  UserPlus,
  Download,
  // Upload,
} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { useCrud } from "@/hooks/useCrud";
import { toast } from "react-hot-toast";
import { FormField } from "@/components/shared/FormField";
import { handleCustomDateRange } from "@/components/shared/dateFilters";
import {
  createConsultationRequestFilterGroups,
  createConsultationRequestSearchHandler,
  handleConsultationRequestFilters,
} from "@/components/shared/filters";
import axiosInstance from "@/helper/axiosInstance";
// إضافة هذه imports
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
interface ConsultationRequest {
  _id: string;
  ConsultationRequestsName: string;
  ConsultationRequestsEmail: string;
  ConsultationRequestsPhone: string;
  ConsultationRequestsMessage: string;
  consultationRequestsArea: string;
  ConsultationRequestsStatus: "new" | "contacted" | "closed";
  customers?: {
    _id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function ConsultationRequestsPage() {
  const intl = useIntl();

  // pagination & filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update } = useCrud("consultation-requests", filters);

  // Confirmation Dialogs
const addConfirmDialog = useConfirmationDialog({
  onConfirm: () => {
    setAddOpen(false);
    resetForm();
  },
  onCancel: () => {
    // Handle cancel - stay in dialog
  }
});

// Check if form has changes
const hasAddFormChanges = () => {
  return (
    consultationForm.ConsultationRequestsName !== "" ||
    consultationForm.ConsultationRequestsEmail !== "" ||
    consultationForm.ConsultationRequestsPhone !== "" ||
    consultationForm.ConsultationRequestsMessage !== "" ||
    consultationForm.consultationRequestsArea !== "" ||
    consultationForm.ConsultationRequestsStatus !== "new" ||
    consultationForm.customerAddress !== ""
  );
};

// Handle add dialog close with confirmation
const handleAddDialogClose = (open: boolean) => {
  if (!open && hasAddFormChanges()) {
    addConfirmDialog.showDialog();
  } else {
    setAddOpen(false);
    if (!open) resetForm();
  }
};

  // Add Consultation Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Status State
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editedStatus, setEditedStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Table Edit Status State
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [tableEditStatus, setTableEditStatus] = useState<string>("");

  // Import State
  // const [importLoading, setImportLoading] = useState(false);

  // Form State
  const [consultationForm, setConsultationForm] = useState({
    ConsultationRequestsName: "",
    ConsultationRequestsEmail: "",
    ConsultationRequestsPhone: "",
    ConsultationRequestsMessage: "",
    consultationRequestsArea: "",
    ConsultationRequestsStatus: "new" as const,
    customerAddress: "",
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

  const consultations: ConsultationRequest[] = list.data?.data || [];

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
  const [viewing, setViewing] = useState<ConsultationRequest | null>(null);

  const handleView = (consultation: ConsultationRequest) => {
    setViewing(consultation);
    setViewOpen(true);
    setIsEditingStatus(false);
    setEditedStatus("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "contacted":
        return "bg-yellow-100 text-yellow-700";
      case "closed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return "🆕";
      case "contacted":
        return "📞";
      case "closed":
        return "✅";
      default:
        return "";
    }
  };

  // Handle phone change
  const handlePhoneChange = (value: string | undefined) => {
    setConsultationForm((prev) => ({
      ...prev,
      ConsultationRequestsPhone: value || "",
    }));
  };

  // Handle Status Edit in View Dialog
  const handleEditStatus = () => {
    if (viewing) {
      setIsEditingStatus(true);
      setEditedStatus(viewing.ConsultationRequestsStatus);
    }
  };

  const handleCancelEditStatus = () => {
    setIsEditingStatus(false);
    setEditedStatus("");
  };

  const handleSaveStatus = async () => {
    if (!viewing || !editedStatus) return;

    try {
      setUpdatingStatus(true);

      await update.mutateAsync({
        id: viewing._id,
        payload: { ConsultationRequestsStatus: editedStatus },
      });

      setViewing({
        ...viewing,
        ConsultationRequestsStatus:
          editedStatus as ConsultationRequest["ConsultationRequestsStatus"],
      });

      setIsEditingStatus(false);
      list.refetch();
      
      toast.success(intl.formatMessage({ id: "consultation_requests.status_updated_success" }));
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: "consultation_requests.failed_to_update_status" }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Status Edit in Table
  const handleTableStatusClick = (
    e: React.MouseEvent,
    requestId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    setEditingRequestId(requestId);
    setTableEditStatus(currentStatus);
  };

  const handleTableStatusChange = async (
    requestId: string,
    newStatus: string
  ) => {
    try {
      await update.mutateAsync({
        id: requestId,
        payload: { ConsultationRequestsStatus: newStatus },
      });

      list.refetch();
      setEditingRequestId(null);
      setTableEditStatus("");
      
      toast.success(intl.formatMessage({ id: "consultation_requests.status_updated_success" }));
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: "consultation_requests.failed_to_update_status" }));
      setEditingRequestId(null);
      setTableEditStatus("");
    }
  };

  const handleCancelTableEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRequestId(null);
    setTableEditStatus("");
  };

  // Add Consultation Functions
  const handleAddConsultation = async () => {
    try {
      setLoading(true);

      if (
        !consultationForm.ConsultationRequestsName ||
        !consultationForm.ConsultationRequestsEmail ||
        !consultationForm.ConsultationRequestsPhone ||
        !consultationForm.ConsultationRequestsMessage ||
        !consultationForm.consultationRequestsArea
      ) {
        toast.error(intl.formatMessage({ id: "consultation_requests.fill_required_fields" }));
        return;
      }

      const consultationResponse :any = await create.mutateAsync(consultationForm);

      if (consultationResponse) {
        const result = consultationResponse.result || consultationResponse;
        
        if (result.customer) {
          toast.success(
            intl.formatMessage({ 
              id: "consultation_requests.consultation_and_customer_created" 
            }, { 
              customerId: result.customer._id 
            })
          );
        } else {
          toast.success(intl.formatMessage({ id: "consultation_requests.consultation_created_success" }));
        }
        
        setAddOpen(false);
        resetForm();
        list.refetch();
      }
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: "consultation_requests.consultation_creation_failed" }));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConsultationForm({
      ConsultationRequestsName: "",
      ConsultationRequestsEmail: "",
      ConsultationRequestsPhone: "",
      ConsultationRequestsMessage: "",
      consultationRequestsArea: "",
      ConsultationRequestsStatus: "new",
      customerAddress: "",
    });
  };

  // Export function
  const handleExportConsultationRequests = async () => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "consultation_requests.exporting_requests" }));

    try {
      const response = await axiosInstance.get(
        "/consultation-requests/export",
        {
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const blob = new Blob([response.data]);
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || intl.formatMessage({ id: "consultation_requests.export_failed" }));
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consultation_requests_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "consultation_requests.requests_exported_success" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || intl.formatMessage({ id: "consultation_requests.export_failed" }));
      console.error("Export error:", error);
    }
  };

  // Download template function
  // const handleDownloadTemplate = async () => {
  //   const loadingToast = toast.loading(intl.formatMessage({ id: "consultation_requests.downloading_template" }));

  //   try {
  //     const response = await axiosInstance.get(
  //       "/consultation-requests/download-template",
  //       {
  //         responseType: "blob",
  //       }
  //     );

  //     const blob = new Blob([response.data], {
  //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //     });

  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "consultation_requests_import_template.xlsx";
  //     document.body.appendChild(a);
  //     a.click();

  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(url);
  //       document.body.removeChild(a);
  //     }, 100);

  //     toast.dismiss(loadingToast);
  //     toast.success(intl.formatMessage({ id: "consultation_requests.template_downloaded_success" }));
  //   } catch (error: any) {
  //     toast.dismiss(loadingToast);
  //     toast.error(error.message || intl.formatMessage({ id: "consultation_requests.template_download_failed" }));
  //   }
  // };

  // // Import function
  // const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const loadingToast = toast.loading(intl.formatMessage({ id: "consultation_requests.importing_requests" }));
  //   setImportLoading(true);

  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file);

  //     const response = await axiosInstance.post(
  //       "/consultation-requests/import",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     const results = response.data.result?.results || response.data.results;

  //     if (results) {
  //       const { summary } = results;
  //       let message = intl.formatMessage({ id: "consultation_requests.import_completed" }) + " ";
  //       message += intl.formatMessage({ id: "consultation_requests.import_success" }, { count: summary.success || 0 }) + ", ";
  //       message += intl.formatMessage({ id: "consultation_requests.import_updated" }, { count: summary.updated || 0 }) + ", ";
  //       message += intl.formatMessage({ id: "consultation_requests.import_customers_created" }, { count: summary.customersCreated || 0 }) + ", ";
  //       message += intl.formatMessage({ id: "consultation_requests.import_failed" }, { count: summary.failed || 0 });

  //       if (summary.failed > 0) {
  //         toast.error(message);
  //       } else {
  //         toast.success(message);
  //       }

  //       list.refetch();
  //     } else {
  //       toast.success(intl.formatMessage({ id: "consultation_requests.import_completed_success" }));
  //       list.refetch();
  //     }
  //   } catch (error: any) {
  //     const errorMessage = error.response?.data?.message || error.message || intl.formatMessage({ id: "consultation_requests.import_failed" });
  //     toast.error(errorMessage);
  //   } finally {
  //     toast.dismiss(loadingToast);
  //     setImportLoading(false);
  //     event.target.value = "";
  //   }
  // };

  return (
    <div className="p-6 space-y-4 !font-tajawal" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-3 md:flex-row flex-col gap-3">
        <Title
          title={intl.formatMessage({ id: "consultation_requests.title" })}
          subtitle={intl.formatMessage({ id: "consultation_requests.subtitle" })}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportConsultationRequests}
          >
            <Download className="w-4 h-4" />
            {intl.formatMessage({ id: "consultation_requests.export" })}
          </Button>

          {/* Add Request Button */}
          <Button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" />
            {intl.formatMessage({ id: "consultation_requests.add_request" })}
          </Button>
        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "consultation_requests.consultation_requests" })}
        icon={MessageSquare}
        loading={list.isLoading}
        isEmpty={!consultations?.length}
        columnCount={10}
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
          placeholder: intl.formatMessage({ id: "consultation_requests.search_placeholder" }),
          onKeyDown: createConsultationRequestSearchHandler(ChangeFilter),
        }}
        filterGroups={createConsultationRequestFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleConsultationRequestFilters(
              filterKey,
              filterValue,
              ChangeFilter
            );
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">{intl.formatMessage({ id: "consultation_requests.hash" })}</TableHead>
            <SortableTH
              sortKey="consultationId"
              label={intl.formatMessage({ id: "consultation_requests.id" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="customerName"
              label={intl.formatMessage({ id: "consultation_requests.name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "consultation_requests.contact_info" })}</TableHead>
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "consultation_requests.message" })}</TableHead>
            <SortableTH
              sortKey="areaOfInterest"
              label={intl.formatMessage({ id: "consultation_requests.area_of_interest" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="status"
              label={intl.formatMessage({ id: "consultation_requests.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "consultation_requests.date" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "consultation_requests.customer" })}</TableHead>
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "consultation_requests.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {consultations.map((consultation, i) => (
              <TableRow
                key={consultation._id}
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
                onClick={() => handleView(consultation)}
              >
                <TableCell className="text-right">{i + 1}</TableCell>
                <TableCell className="font-medium text-black font-mono text-sm">
                  #{consultation._id?.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {consultation.ConsultationRequestsName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {consultation.ConsultationRequestsEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {consultation.ConsultationRequestsPhone}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 truncate max-w-xs">
                    {consultation.ConsultationRequestsMessage}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 truncate max-w-xs">
                    {consultation.consultationRequestsArea}
                  </p>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingRequestId === consultation._id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={tableEditStatus}
                        onValueChange={(value) =>
                          handleTableStatusChange(consultation._id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">{intl.formatMessage({ id: "consultation_requests.new" })}</SelectItem>
                          <SelectItem value="contacted">{intl.formatMessage({ id: "consultation_requests.contacted" })}</SelectItem>
                          <SelectItem value="closed">{intl.formatMessage({ id: "consultation_requests.closed" })}</SelectItem>
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
                          consultation._id?.slice(0, 8) || "",
                          consultation.ConsultationRequestsStatus
                        )
                      }
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize cursor-pointer flex items-center gap-1 ${getStatusColor(
                          consultation.ConsultationRequestsStatus
                        )}`}
                      >
                        <span>
                          {getStatusIcon(
                            consultation.ConsultationRequestsStatus
                          )}
                        </span>
                        {intl.formatMessage({ id: `consultation_requests.${consultation.ConsultationRequestsStatus}` })}
                      </span>
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {consultation.createdAt
                    ? new Date(consultation.createdAt).toLocaleDateString("ar-SA")
                    : "-"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {consultation.customers ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      #{consultation.customers._id}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {intl.formatMessage({ id: "consultation_requests.not_found" })}
                    </span>
                  )}
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
                        handleView(consultation);
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

{/* Add Consultation Dialog */}
<Dialog open={addOpen} onOpenChange={handleAddDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {intl.formatMessage({ id: "consultation_requests.add_new_consultation" })}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {intl.formatMessage({ id: "consultation_requests.auto_customer_creation" })}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "consultation_requests.full_name_required" })}</Label>
                <Input
                  value={consultationForm.ConsultationRequestsName}
                  onChange={(e) =>
                    setConsultationForm((prev) => ({
                      ...prev,
                      ConsultationRequestsName: e.target.value,
                    }))
                  }
                  placeholder={intl.formatMessage({ id: "consultation_requests.enter_full_name" })}
                />
              </div>
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "consultation_requests.area_of_interest_required" })}</Label>
                <Input
                  value={consultationForm.consultationRequestsArea}
                  onChange={(e) =>
                    setConsultationForm((prev) => ({
                      ...prev,
                      consultationRequestsArea: e.target.value,
                    }))
                  }
                  placeholder={intl.formatMessage({ id: "consultation_requests.enter_area_of_interest" })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{intl.formatMessage({ id: "consultation_requests.email_required" })}</Label>
              <Input
                type="email"
                value={consultationForm.ConsultationRequestsEmail}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    ConsultationRequestsEmail: e.target.value,
                  }))
                }
                placeholder={intl.formatMessage({ id: "consultation_requests.email_placeholder" })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="ConsultationRequestsPhone"
                label={intl.formatMessage({ id: "consultation_requests.phone_required" })}
                value={consultationForm.ConsultationRequestsPhone}
                onPhoneChange={handlePhoneChange}
                onChange={(e) => {
                  e;
                }}
                variant="phone"
                placeholder={intl.formatMessage({ id: "consultation_requests.enter_phone" })}
                required
              />
              <div className="space-y-2">
                <Label>{intl.formatMessage({ id: "consultation_requests.status" })}</Label>
                <Select
                  value={consultationForm.ConsultationRequestsStatus}
                  onValueChange={(value: any) =>
                    setConsultationForm((prev) => ({
                      ...prev,
                      ConsultationRequestsStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{intl.formatMessage({ id: "consultation_requests.new" })}</SelectItem>
                    <SelectItem value="contacted">{intl.formatMessage({ id: "consultation_requests.contacted" })}</SelectItem>
                    <SelectItem value="closed">{intl.formatMessage({ id: "consultation_requests.closed" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{intl.formatMessage({ id: "consultation_requests.customer_address_optional" })}</Label>
              <Input
                value={consultationForm.customerAddress}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    customerAddress: e.target.value,
                  }))
                }
                placeholder={intl.formatMessage({ id: "consultation_requests.enter_customer_address" })}
              />
            </div>

            <div className="space-y-2">
              <Label>{intl.formatMessage({ id: "consultation_requests.message_required" })}</Label>
              <Textarea
                value={consultationForm.ConsultationRequestsMessage}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    ConsultationRequestsMessage: e.target.value,
                  }))
                }
                placeholder={intl.formatMessage({ id: "consultation_requests.enter_consultation_message" })}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {intl.formatMessage({ id: "consultation_requests.customer_auto_creation_note" })}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                {intl.formatMessage({ id: "consultation_requests.cancel" })}
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddConsultation}
              disabled={loading}
              className="text-white"
            >
              {loading ? intl.formatMessage({ id: "consultation_requests.creating" }) : intl.formatMessage({ id: "consultation_requests.create_request_customer" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {intl.formatMessage({ id: "consultation_requests.consultation_details" })}
            </DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Request Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "consultation_requests.request_id" })}
                  </Label>
                  <p className="font-mono text-sm">#{viewing._id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "consultation_requests.status" })}
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
                          <SelectItem value="new">{intl.formatMessage({ id: "consultation_requests.new" })}</SelectItem>
                          <SelectItem value="contacted">{intl.formatMessage({ id: "consultation_requests.contacted" })}</SelectItem>
                          <SelectItem value="closed">{intl.formatMessage({ id: "consultation_requests.closed" })}</SelectItem>
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
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center gap-1 ${getStatusColor(
                          viewing.ConsultationRequestsStatus
                        )}`}
                      >
                        <span>
                          {getStatusIcon(viewing.ConsultationRequestsStatus)}
                        </span>
                        {intl.formatMessage({ id: `consultation_requests.${viewing.ConsultationRequestsStatus}` })}
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
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {intl.formatMessage({ id: "consultation_requests.contact_information" })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.full_name" })}
                    </Label>
                    <p className="font-medium">
                      {viewing.ConsultationRequestsName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.email_address" })}
                    </Label>
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {viewing.ConsultationRequestsEmail}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.phone_number" })}
                    </Label>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {viewing.ConsultationRequestsPhone}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.customer_info" })}
                    </Label>
                    {viewing.customers ? (
                      <div className="text-sm">
                        <p className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {intl.formatMessage({ id: "consultation_requests.customer_id_display" }, { id: viewing.customers._id?.slice(-6) })}
                          </span>
                        </p>
                        {viewing.customers.customerAddress && (
                          <p className="text-gray-600 text-xs mt-1">
                            {intl.formatMessage({ id: "consultation_requests.address_display" }, { address: viewing.customers.customerAddress })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-red-600 text-sm">{intl.formatMessage({ id: "consultation_requests.no_customer_found" })}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {intl.formatMessage({ id: "consultation_requests.consultation_details_section" })}
                </h3>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.area_of_interest" })}
                    </Label>
                    <p className="text-sm mt-1">
                      {viewing.consultationRequestsArea}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">
                      {intl.formatMessage({ id: "consultation_requests.message" })}
                    </Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {viewing.ConsultationRequestsMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "consultation_requests.request_date" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "consultation_requests.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {intl.formatMessage({ id: "consultation_requests.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString("ar-SA")
                        : intl.formatMessage({ id: "consultation_requests.not_available" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  {intl.formatMessage({ id: "consultation_requests.quick_actions" })}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`mailto:${viewing.ConsultationRequestsEmail}`)
                    }
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {intl.formatMessage({ id: "consultation_requests.send_email" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`tel:${viewing.ConsultationRequestsPhone}`)
                    }
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {intl.formatMessage({ id: "consultation_requests.call_client" })}
                  </Button>
                </div>
              </div>
            </div>
            
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                {intl.formatMessage({ id: "consultation_requests.close" })}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Consultation Confirmation Dialog */}
<ConfirmationDialog
  open={addConfirmDialog.isOpen}
  onOpenChange={addConfirmDialog.setIsOpen}
  variant="add"
  onConfirm={addConfirmDialog.handleConfirm}
  onCancel={addConfirmDialog.handleCancel}
  isDestructive={true}
/>
    </div>
  );
}