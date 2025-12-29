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

  Plus,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";
import { FormField } from "@/components/shared/FormField";
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

interface LocationData {
  country: string;
  state: string;
  city: string;
  countryCode: string;
  stateCode: string;
}

const SERVICES_OPTIONS = [
  { label: "contacts.service_technical_training", value: "Technical Training & Consultation" },
  { label: "contacts.service_equipment_sales", value: "Equipment Sales & Solutions" },
  { label: "contacts.service_quality_assurance", value: "Quality Assurance & Validation" },
  { label: "contacts.service_custom_chemical", value: "Custom Chemical Solutions" },
  { label: "contacts.service_laboratory_setup", value: "Laboratory Setup & Support" },
  { label: "contacts.service_regulatory", value: "Regulatory Compliance & Documentation" },
  { label: "contacts.service_maintenance", value: "Maintenance & After-Sales Support" },
  { label: "contacts.service_research", value: "Research & Development Solutions" },
];

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

  const { list, create, update, del: remove } = useCrud("contacts", filters);
  const { list: customersList, create: createCustomer } = useCrud("customers");

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
  const allCustomers: any = customersList.data?.data || [];
  const customers = allCustomers.filter((customer: any) => customer.customerSource === "contact");

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

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]
        }.xlsx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

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

          <AddContact
            create={create.mutate}
            createCustomer={createCustomer}
            isLoading={create.isPending}
            customers={customers}
          />
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
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">
                        {contact.address}
                      </span>
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

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {intl.formatMessage({ id: "contacts.address" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">{viewing.address}</p>
                  </div>
                </div>
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

// ✅ Add Contact Dialog Component
function AddContact({
  create,
  createCustomer,
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

  const [customerMode, setCustomerMode] = useState<"new" | "existing">("existing");

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phoneNumber: "",
    address: "",
    services: [] as string[],
    message: "",
    status: false,
    customer: "",
  });

  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerNotes: "",
    customerSource: "contact",
    customerAddress: "",
    customerLocation: "",
  });

  const [locationData, setLocationData] = useState<LocationData>({
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
    form.contactName.trim() &&
    form.email.trim() &&
    form.phoneNumber.trim() &&
    form.address.trim() &&
    form.message.trim() &&
    (customerMode === "new" ?
      (customerForm.customerName.trim() &&
        customerForm.customerPhone.trim() &&
        customerForm.customerAddress.trim()) :
      true
    );

  const hasFormChanges = () => {
    return (
      form.contactName !== "" ||
      form.email !== "" ||
      form.phoneNumber !== "" ||
      form.address !== "" ||
      form.message !== "" ||
      form.services.length > 0 ||
      form.customer !== "" ||
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
      contactName: "",
      email: "",
      phoneNumber: "",
      address: "",
      services: [],
      message: "",
      status: false,
      customer: "",
    });
    setCustomerForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNotes: "",
      customerSource: "contact",
      customerAddress: "",
      customerLocation: "",
    });
    setLocationData({
      country: "",
      state: "",
      city: "",
      countryCode: "",
      stateCode: "",
    });
    setCustomerMode("existing");
  };

  const handlePhoneChange = (value: string | undefined) => {
    if (customerMode === "new") {
      setCustomerForm((prev) => ({
        ...prev,
        customerPhone: value || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        phoneNumber: value || "",
      }));
    }
  };

  const handleServiceToggle = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      let customerId = form.customer;

      if (customerMode === "new") {
        if (
          !customerForm.customerName ||
          !customerForm.customerPhone ||
          !customerForm.customerAddress
        ) {
          toast.error(intl.formatMessage({ id: "contacts.fill_required_fields" }));
          return;
        }

        try {
          const customerResponse: any = await createCustomer.mutateAsync(customerForm);
          customerId = customerResponse?.result?._id || customerResponse?._id;

          if (!customerId) {
            toast.error(intl.formatMessage({ id: "contacts.failed_customer_creation" }));
            return;
          }

          toast.success(intl.formatMessage({ id: "contacts.customer_created_success" }));
        } catch (customerError: any) {
          console.error("Customer creation error:", customerError);
          const errorMessage = customerError?.response?.data?.message ||
            customerError?.message ||
            intl.formatMessage({ id: "contacts.failed_customer_creation" });
          toast.error(errorMessage);
          return;
        }
      }

      const contactData = {
        contactName: form.contactName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        address: form.address,
        services: form.services,
        message: form.message,
        status: form.status,
        customer: customerId || undefined,
      };

      const cleanForm = Object.fromEntries(
        Object.entries(contactData)
          .filter(([, value]) => {
            if (typeof value === "string") return value.trim() !== "";
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined;
          })
      );

      await create(cleanForm);
      resetForm();
      setOpen(false);
      toast.success(intl.formatMessage({ id: "contacts.contact_created_success" }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "contacts.contact_creation_failed" });
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
            <Plus className="w-4 h-4 mr-2" /> {intl.formatMessage({ id: "contacts.new_contact" })}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "contacts.new_contact_request" })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: "contacts.create_contact_description" })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Mode Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {intl.formatMessage({ id: "contacts.customer_selection" })}
              </Label>

              <RadioGroup
                value={customerMode}
                onValueChange={(value: "new" | "existing") => {
                  setCustomerMode(value);
                  setForm(prev => ({ ...prev, customer: "" }));
                  setCustomerForm({
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    customerNotes: "",
                    customerSource: "contact",
                    customerAddress: "",
                    customerLocation: "",
                  });
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing" className="cursor-pointer">
                    {intl.formatMessage({ id: "contacts.select_existing_customer" })}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="cursor-pointer">
                    {intl.formatMessage({ id: "contacts.create_new_customer" })}
                  </Label>
                </div>
              </RadioGroup>

              {customerMode === "existing" ? (
                <div className="space-y-2">
                  <Label>{intl.formatMessage({ id: "contacts.select_customer" })}</Label>
                  <Select
                    value={form.customer}
                    onValueChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        customer: value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={intl.formatMessage({ id: "contacts.choose_customer_optional" })} />
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "contacts.customer_name_required" })}</Label>
                    <Input
                      value={customerForm.customerName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "contacts.enter_customer_name" })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{intl.formatMessage({ id: "contacts.email" })}</Label>
                    <Input
                      type="email"
                      value={customerForm.customerEmail}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "contacts.email_placeholder" })}
                    />
                  </div>
                  <FormField
                    id="customerPhone"
                    label={intl.formatMessage({ id: "contacts.phone_required" })}
                    value={customerForm.customerPhone}
                    onChange={(e) => { e; }}
                    onPhoneChange={handlePhoneChange}
                    variant="phone"
                    placeholder={intl.formatMessage({ id: "contacts.enter_phone" })}
                    required
                  />
                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "contacts.address_required" })}</Label>
                    <Input
                      value={customerForm.customerAddress}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerAddress: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "contacts.customer_address" })}
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {intl.formatMessage({ id: "contacts.customer_location" })}
                      </Label>
                    </div>

                    <LocationSelector
                      locationData={locationData}
                      setLocationData={setLocationData}
                      setForm={setCustomerForm}
                      intl={intl}
                      fieldPrefix="customer"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>{intl.formatMessage({ id: "contacts.notes" })}</Label>
                    <Input
                      value={customerForm.customerNotes}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerNotes: e.target.value,
                        }))
                      }
                      placeholder={intl.formatMessage({ id: "contacts.additional_notes" })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="contactName"
                label={intl.formatMessage({ id: "contacts.contact_name" })}
                value={form.contactName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactName: e.target.value }))
                }
                required
              />

              <FormField
                id="email"
                label={intl.formatMessage({ id: "contacts.email" })}
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />

              <FormField
                id="phoneNumber"
                label={intl.formatMessage({ id: "contacts.phone_number" })}
                variant="phone"
                onChange={(e) => { e; }}
                value={form.phoneNumber}
                onPhoneChange={(value) => setForm((f) => ({ ...f, phoneNumber: value || "" }))}
                placeholder={intl.formatMessage({ id: "contacts.enter_phone" })}
                required
              />

              <div className="col-span-full">
                <FormField
                  id="address"
                  label={intl.formatMessage({ id: "contacts.address" })}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Services Selection */}
              <div className="col-span-full space-y-3">
                <Label>{intl.formatMessage({ id: "contacts.select_services" })}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50">
                  {SERVICES_OPTIONS.map((service) => (
                    <div key={service.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.value}
                        checked={form.services.includes(service.value)}
                        onCheckedChange={() => handleServiceToggle(service.value)}
                      />
                      <Label
                        htmlFor={service.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {intl.formatMessage({ id: service.label })}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-full">
                <FormField
                  id="message"
                  label={intl.formatMessage({ id: "contacts.message" })}
                  variant="textarea"
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Status */}
              <div className="col-span-full flex items-center space-x-2">
                <Checkbox
                  id="status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, status: checked as boolean }))
                  }
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {intl.formatMessage({ id: "contacts.mark_as_active" })}
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  {intl.formatMessage({ id: "contacts.cancel" })}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="text-white"
                disabled={!canSubmit || loading}
              >
                {loading
                  ? intl.formatMessage({ id: "contacts.creating" })
                  : customerMode === "new"
                    ? intl.formatMessage({ id: "contacts.create_customer_contact" })
                    : intl.formatMessage({ id: "contacts.create_contact" })
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

// Location Selector Component
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
        <Label>{intl.formatMessage({ id: "contacts.country" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "contacts.select_country" })} />
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
        <Label>{intl.formatMessage({ id: "contacts.state" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "contacts.select_state" })} />
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
        <Label>{intl.formatMessage({ id: "contacts.city" })}</Label>
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
            <SelectValue placeholder={intl.formatMessage({ id: "contacts.select_city" })} />
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
              <strong>{intl.formatMessage({ id: "contacts.selected_location" })}:</strong> {locationData.city}, {locationData.state}, {locationData.country}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>{intl.formatMessage({ id: "contacts.location_code" })}:</strong> {locationData.city}, {locationData.stateCode}, {locationData.countryCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}