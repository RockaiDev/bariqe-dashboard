import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import ExcelJS from 'exceljs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,

} from "@/components/ui/dialog";

import {
  Eye,

  
  Mail,
  Phone,
  Download,
  Edit2,
  X,
  MapPin,
  User,
  Contact,
  Trash2,
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

import { Badge } from "@/components/ui/badge";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { Label } from "@/components/ui/label";
import { useCrud } from "@/hooks/useCrud";
import { handleCustomDateRange } from "@/components/shared/dateFilters";
import {
  createContactFilterGroups,
  createContactSearchHandler,
  handleContactFilters,
} from "@/components/shared/filters";
import toast from "react-hot-toast";
import axiosInstance from "@/helper/axiosInstance";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useSearchParams } from "react-router-dom";

interface Contact {
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
    customerLocation?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}




export default function ContactPage() {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, update, del: remove } = useCrud("contacts", filters);

  // Table Edit Status State
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [tableEditStatus, setTableEditStatus] = useState<boolean>(false);

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

  const contacts: Contact[] = list.data?.data || [];

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
  const [viewing, setViewing] = useState<Contact | null>(null);

  const handleView = async (contact: Contact) => {
    setViewing(contact);
    setViewOpen(true);

    // ✅ Mark as read if not already
    if (!contact.status) {
      try {
        await update.mutateAsync({
          id: contact._id,
          payload: { status: true },
        });
        list.refetch();
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const deleteConfirmDialog = useConfirmationDialog({
    onConfirm: async () => {
      if (viewing) {
        try {
          await remove.mutateAsync(viewing._id);
          setViewOpen(false);
          setViewing(null);
          list.refetch();
          toast.success(intl.formatMessage({ id: "contacts.deleted_success" }));
        } catch (error: any) {
          toast.error(intl.formatMessage({ id: "contacts.delete_failed" }));
        }
      }
    },
    onCancel: () => { },
  });

  const handleDelete = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setViewing(contact);
    deleteConfirmDialog.showDialog();
  };
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && contacts.length > 0) {
      const contact = contacts.find((c) => c._id === viewId);
      if (contact) {
        handleView(contact);
        // Remove view param from URL
        searchParams.delete("view");
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, contacts])
  // Helper function to get status badge
  const getStatusBadge = (status: boolean) => {
    if (status) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 border border-green-300 rounded-lg">
          {intl.formatMessage({ id: "contacts.active" })}
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-lg">
        {intl.formatMessage({ id: "contacts.inactive" })}
      </span>
    );
  };

  // Handle Status Edit in Table
  const handleTableStatusClick = (
    e: React.MouseEvent,
    contactId: string,
    currentStatus: boolean
  ) => {
    e.stopPropagation();
    setEditingContactId(contactId);
    setTableEditStatus(currentStatus);
  };

  const handleTableStatusChange = async (
    contactId: string,
    newStatus: boolean
  ) => {
    try {
      await update.mutateAsync({
        id: contactId,
        payload: { status: newStatus },
      });

      list.refetch();
      setEditingContactId(null);
      toast.success(intl.formatMessage({ id: "contacts.status_updated_success" }));
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: "contacts.failed_to_update_status" }));
      setEditingContactId(null);
    }
  };

  const handleCancelTableEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContactId(null);
  };

  const handleExportContacts = async () => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "contacts.exporting_contacts" }));

    try {
      const response = await axiosInstance.get("/contacts/export", {
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

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];

        if (worksheet) {
          const headerRow = worksheet.getRow(1);
          const columnsToDelete: number[] = [];

          headerRow.eachCell((cell, colNumber) => {
            const norm = String(cell.value || "").toLowerCase().replace(/[\s_]+/g, '');

            const isAddress = norm === "address" || norm === "contactaddress" || norm === "العنوان";
            const isCustomerName = norm === "customername" || norm === "اسمالعميل";
            const isCustomerEmail = norm === "customeremail" || norm === "البريدالإلكترونيللعميل" || norm === "بريدالعميل";
            const isCustomerCompany = norm === "customercompany" || norm === "شركةالعميل" || norm === "company" || norm === "الشركة";
            const isCustomerServices = norm === "customerservices" || norm === "services" || norm === "الخدمات" || norm === "خدماتالعميل";

            if (isAddress || isCustomerName || isCustomerEmail || isCustomerCompany || isCustomerServices) {
              columnsToDelete.push(colNumber);
            }
          });

          columnsToDelete.sort((a, b) => b - a);
          columnsToDelete.forEach((colNumber) => {
            worksheet.spliceColumns(colNumber, 1);
          });

          const newBuffer = await workbook.xlsx.writeBuffer();
          const newBlob = new Blob([newBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          const url = window.URL.createObjectURL(newBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
        } else {
          throw new Error("Worksheet not found");
        }
      } catch (e) {
        console.error("Excel processing failed, downloading original", e);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      }

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "contacts.contacts_exported_success" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || intl.formatMessage({ id: "contacts.export_failed" }));
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
          title={intl.formatMessage({ id: "contacts.title" })}
          subtitle={intl.formatMessage({ id: "contacts.subtitle" })}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportContacts}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {intl.formatMessage({ id: "contacts.export_contacts" })}
          </Button>


        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "contacts.contact_requests" })}
        icon={Contact}
        loading={list.isLoading}
        isEmpty={!contacts?.length}
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
          placeholder: intl.formatMessage({ id: "contacts.search_placeholder" }),
          onKeyDown: createContactSearchHandler(ChangeFilter),
        }}
        filterGroups={createContactFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleContactFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">#</TableHead>
            <SortableTH
              sortKey="contactName"
              label={intl.formatMessage({ id: "contacts.contact_name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "contacts.contact_info" })}</TableHead>
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "contacts.services" })}</TableHead>
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "contacts.message" })}</TableHead>
            <SortableTH
              sortKey="status"
              label={intl.formatMessage({ id: "contacts.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "contacts.created" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "contacts.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {contacts.map((contact, i) => (
              <TableRow
                key={contact._id}
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
                onClick={() => handleView(contact)}
              >
                <TableCell className="text-right">{(pagination.currentPage - 1) * pagination.perPage + i + 1}</TableCell>
                <TableCell className="font-medium text-black">
                  <div className="space-y-1">
                    <div>{contact.contactName}</div>
                    {contact.customer && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{contact.customer.customerName}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">
                        {contact.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phoneNumber}</span>
                    </div>

                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 text-white max-w-[200px]">
                    {contact.services?.slice(0, 2).map((service, idx) => (
                      <Badge key={idx} className="text-xs text-white">
                        {service.split(' ')[0]}
                      </Badge>
                    ))}
                    {contact.services?.length > 2 && (
                      <Badge variant="outline" className="text-xs text-white">
                        +{contact.services.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {contact.message}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingContactId === contact._id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={tableEditStatus ? "active" : "inactive"}
                        onValueChange={(value) =>
                          handleTableStatusChange(contact._id, value === "active")
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{intl.formatMessage({ id: "contacts.active" })}</SelectItem>
                          <SelectItem value="inactive">{intl.formatMessage({ id: "contacts.inactive" })}</SelectItem>
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
                          contact._id,
                          contact.status
                        )
                      }
                    >
                      <span className="cursor-pointer">
                        {getStatusBadge(contact.status)}
                      </span>
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {contact.createdAt
                    ? new Date(contact.createdAt).toLocaleDateString("en-US", {
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
                        handleView(contact);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDelete(e, contact)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
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
          aria-describedby="view-contact-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "contacts.contact_details" })}
            </DialogTitle>
            <DialogDescription id="view-contact-dialog-description">
              {intl.formatMessage({ id: "contacts.view_contact_description" })}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.contact_name" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.contactName}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.email" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.phone" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.phoneNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.status" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {getStatusBadge(viewing.status)}
                  </div>
                </div>

                {viewing.customer && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {intl.formatMessage({ id: "contacts.customer_info" })}
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md border space-y-2">
                      <p className="font-medium">{viewing.customer.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span>{viewing.customer.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span>{viewing.customer.customerPhone}</span>
                      </div>
                      {viewing.customer.customerLocation && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{viewing.customer.customerLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </div>

              {/* Services */}
              {viewing.services && viewing.services.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.selected_services" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {viewing.services.map((service, idx) => (
                        <Badge key={idx} variant="secondary" className="text-white">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "contacts.message" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                  <p className="text-gray-800 leading-relaxed">
                    {viewing.message}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString()
                        : intl.formatMessage({ id: "contacts.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "contacts.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString()
                        : intl.formatMessage({ id: "contacts.not_available" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "contacts.contact_id" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm font-mono text-gray-600">
                    {viewing._id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="destructive"
              onClick={(e) => viewing && handleDelete(e, viewing)}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {intl.formatMessage({ id: "contacts.delete_request" })}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                {intl.formatMessage({ id: "contacts.close" })}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirmDialog.isOpen}
        onOpenChange={deleteConfirmDialog.setIsOpen}
        variant="delete"
        onConfirm={deleteConfirmDialog.handleConfirm}
        onCancel={deleteConfirmDialog.handleCancel}
      />
    </div>
  );
}



