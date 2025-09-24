import { useState } from "react";
import { useIntl } from "react-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Layers,
  Pen,
  Plus,
  Trash,
  FileSpreadsheet,
  Download,
  Upload,
  FileDown,
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
import { handleCustomDateRange } from "@/components/shared/dateFilters";
import {
  createCategoryFilterGroups,
  createCategorySearchHandler,
  handleCategoryFilters,
} from "@/components/shared/filters";
// إضافة هذه imports
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

interface Category {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  categoryStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoryPage() {
  const intl = useIntl();
  // pagination & filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 15,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update, del } = useCrud("categories", filters);

  // Import/Export states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const ChangeFilter = (
    newQueries: any[],
    type: "queries" | "sorts" = "queries"
  ) => {
    setFilters((f) => ({
      ...f,
      [type]: newQueries,
      page: 1, // reset page عند البحث
    }));
  };

  const categories: Category[] = list.data?.data || [];
  const paginationData = list.data?.pagination ?? {
    currentPage: 1,
    perPage: 15,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
  };

  // تحويل البيانات لتتوافق مع الـ interface
  const pagination = {
    currentPage: paginationData.currentPage,
    perPage: paginationData.perPage,
    total: list.data?.count || 0,
    lastPage: paginationData.totalPages,
  };

  // لإدارة الحذف
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Category | null>(null);

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({
    categoryName: "",
    categoryDescription: "",
    categoryStatus: true,
  });

  const handleEdit = (c: Category) => {
    setEditing(c);
    setEditForm({
      categoryName: c.categoryName,
      categoryDescription: c.categoryDescription,
      categoryStatus: Boolean(c.categoryStatus),
    });
    setEditOpen(true);
  };

  const handleView = (c: Category) => {
    setViewing(c);
    setViewOpen(true);
  };

  // Confirmation Dialogs
const editConfirmDialog = useConfirmationDialog({
  onConfirm: () => {
    setEditOpen(false);
    setEditing(null);
  },
  onCancel: () => {
    // Handle cancel - stay in dialog
  }
});

// Check if edit form has changes
const hasEditFormChanges = () => {
  if (!editing) return false;

  return (
    editForm.categoryName !== editing.categoryName ||
    editForm.categoryDescription !== editing.categoryDescription ||
    editForm.categoryStatus !== Boolean(editing.categoryStatus)
  );
};

// Handle edit dialog close with confirmation
const handleEditDialogClose = (open: boolean) => {
  if (!open && hasEditFormChanges()) {
    editConfirmDialog.showDialog();
  } else {
    setEditOpen(false);
    setEditing(null);
  }
};
  // 🟢 Export Categories Function
// 🟢 Export Categories Function
const handleExportCategories = async () => {
  const loadingToast = toast.loading(intl.formatMessage({ id: "categories.exporting" }));
  try {
    const response = await axiosInstance.get("/categories/export", {
      responseType: "blob",
    });

    // Error response handling
    const contentType = response.headers["content-type"];
    if (contentType?.includes("application/json")) {
      const blob = new Blob([response.data]);
      const text = await blob.text();
      const error = JSON.parse(text);
      throw new Error(error.message || intl.formatMessage({ id: "categories.export_failed" }));
    }

    // Download file
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories_export_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    toast.dismiss(loadingToast);
    toast.success(intl.formatMessage({ id: "categories.export_success" }));
  } catch (error: any) {
    toast.dismiss(loadingToast);
    const errorMessage = error?.response?.data?.message || 
                        error?.message || 
                        intl.formatMessage({ id: "categories.export_failed" });
    toast.error(errorMessage);
  }
};

// 🟢 Download Template
const handleDownloadTemplate = async () => {
  const loadingToast = toast.loading(intl.formatMessage({ id: "categories.downloading_template" }));
  try {
    const response = await axiosInstance.get(
      "/categories/download-template",
      {
        responseType: "blob",
      }
    );

    const contentType = response.headers["content-type"];
    if (contentType?.includes("application/json")) {
      const blob = new Blob([response.data]);
      const text = await blob.text();
      const error = JSON.parse(text);
      throw new Error(error.message || intl.formatMessage({ id: "categories.template_download_failed" }));
    }

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categories_import_template.xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    toast.dismiss(loadingToast);
    toast.success(intl.formatMessage({ id: "categories.template_downloaded" }));
  } catch (error: any) {
    toast.dismiss(loadingToast);
    const errorMessage = error?.response?.data?.message || 
                        error?.message || 
                        intl.formatMessage({ id: "categories.template_download_failed" });
    toast.error(errorMessage);
  }
};

// 🟢 Import Categories
const handleImportCategories = async () => {
  if (!selectedFile) {
    toast.error(intl.formatMessage({ id: "categories.select_file_error" }));
    return;
  }

  setImporting(true);
  const loadingToast = toast.loading(intl.formatMessage({ id: "categories.importing" }));
  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const result = await axiosInstance.post("/categories/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.dismiss(loadingToast);

    if (result?.data?.results?.categories) {
      const { success, updated, failed } = result.data.results.categories;
      const summary = result.data.results.summary;

      if (success?.length > 0)
        toast.success(intl.formatMessage({ id: "categories.import_success_count" }, { count: success.length }));
      if (updated?.length > 0)
        toast.success(intl.formatMessage({ id: "categories.import_updated_count" }, { count: updated.length }));
      if (failed?.length > 0) {
        toast.error(intl.formatMessage({ id: "categories.import_failed_count" }, { count: failed.length }));
        if (failed.length <= 5) {
          failed.forEach((f: any) =>
            toast.error(
              `❌ ${f.categoryName || "Unknown"} - ${
                f.error || "Unknown error"
              }`
            )
          );
        }
      }

      if (summary) {
        toast.success(
          intl.formatMessage({ id: "categories.import_summary" }, { 
            total: summary.total,
            success: summary.success, 
            updated: summary.updated, 
            failed: summary.failed 
          })
        );
      }
    }

    list.refetch();
    setImportDialogOpen(false);
    setSelectedFile(null);
  } catch (error: any) {
    toast.dismiss(loadingToast);
    const errorMessage = error?.response?.data?.message ||
                        error?.message ||
                        intl.formatMessage({ id: "categories.import_failed" });
    toast.error(errorMessage);
  } finally {
    setImporting(false);
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
          title={intl.formatMessage({ id: "categories_title" })}
          subtitle={intl.formatMessage({ id: "categories_subtitle" })}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Export/Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                {intl.formatMessage({ id: "excel_operations" })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handleExportCategories}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "export_all_categories" })}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setImportDialogOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "import_categories" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AddCategory
            create={create.mutate}
            isLoading={create.isPending}
            // intl={intl}
          />
        </div>
      </div>
      <DataTable
        title={intl.formatMessage({ id: "categories.all_categories" })}
        icon={Layers}
        loading={list.isLoading}
        isEmpty={!categories?.length}
        columnCount={6}
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
          placeholder: intl.formatMessage({ id: "categories.search_placeholder" }),
          onKeyDown: createCategorySearchHandler(ChangeFilter),
        }}
        filterGroups={createCategoryFilterGroups((key: string) => intl.formatMessage({ id: key }))}
        onFiltersApply={(filters, dateFilter) => {
          // تطبيق فلتر التاريخ
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          // تطبيق باقي الفلاتر
          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleCategoryFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
           <TableHead className=" text-right">#</TableHead>
            <SortableTH
              sortKey="categoryName"
              label={intl.formatMessage({ id: "categories.name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "categories.description" })}</TableHead>
            <SortableTH
              sortKey="categoryStatus"
              label={intl.formatMessage({ id: "categories.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "categories.created" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <SortableTH
              sortKey="updatedAt"
              label={intl.formatMessage({ id: "categories.updated" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "categories.actions" })}</TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {categories.map((c, i) => (
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
                <TableCell className="font-medium text-black">
                  {c.categoryName}
                </TableCell>
                <TableCell className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {c.categoryDescription}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      c.categoryStatus
                        ? "bg-green-100 text-green-700 border border-green-700 rounded-lg"
                        : "bg-red-100 text-red-700 border border-red-700 rounded-lg"
                    }`}
                  >
                    {c.categoryStatus ? intl.formatMessage({ id: "categories.active" }) : intl.formatMessage({ id: "categories.inactive" })}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {c.updatedAt
                    ? new Date(c.updatedAt).toLocaleDateString("en-US", {
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
                        handleEdit(c);
                      }}
                    >
                      <Pen className="w-4 h-4" />
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
                      <Trash className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </>
        )}
      />

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {intl.formatMessage({ id: "categories.import.title" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Button
                onClick={handleDownloadTemplate}
                className="cursor-pointer text-white mb-3"
              >
                <FileDown className="w-4 h-4 mr-2 text-white" />
                {intl.formatMessage({ id: "categories.import.download_template" })}
              </Button>
              <h4 className="font-semibold text-blue-900 mb-2">
                {intl.formatMessage({ id: "categories.import.instructions_title" })}:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>{intl.formatMessage({ id: "categories.import.instruction_1" })}</li>
                <li>{intl.formatMessage({ id: "categories.import.instruction_2" })}</li>
                <li>{intl.formatMessage({ id: "categories.import.instruction_3" })}</li>
                <li>{intl.formatMessage({ id: "categories.import.instruction_4" })}</li>
                <li>{intl.formatMessage({ id: "categories.import.instruction_5" })}</li>
                <li>{intl.formatMessage({ id: "categories.import.instruction_6" })}</li>
              </ol>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>{intl.formatMessage({ id: "categories.select_file" })}</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  {intl.formatMessage({ id: "categories.selected" })}: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={importing}>
                {intl.formatMessage({ id: "categories.cancel" })}
              </Button>
            </DialogClose>
            <Button
              onClick={handleImportCategories}
              disabled={!selectedFile || importing}
              className="text-white"
            >
              {importing ? (
                <>{intl.formatMessage({ id: "categories.importing_categories" })}</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "categories.import_categories" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "categories.category_details" })}
            </DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.category_name" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">{viewing.categoryName}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.status" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewing.categoryStatus
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {viewing.categoryStatus ? intl.formatMessage({ id: "categories.active" }) : intl.formatMessage({ id: "categories.inactive" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "categories.description" })}
                </Label>
                <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                  <p className="text-gray-800 leading-relaxed">
                    {viewing.categoryDescription}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString()
                        : intl.formatMessage({ id: "categories.not_available" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString()
                        : intl.formatMessage({ id: "categories.not_available" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "categories.category_id" })}
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
                  {intl.formatMessage({ id: "categories.close" })}
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
                <Pen className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "categories.edit_category" })}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>


  {/* Edit Dialog */}
<Dialog open={editOpen} onOpenChange={handleEditDialogClose}>
  <DialogContent className="sm:max-w-[520px]">
    <DialogHeader>
      <DialogTitle>{intl.formatMessage({ id: "categories.edit_category" })}</DialogTitle>
    </DialogHeader>
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!editing) return;
        
        update.mutate({
          id: editing._id,
          payload: editForm,
        }, {
          onSuccess: () => {
            toast.success(intl.formatMessage({ id: "categories.edit_success" }));
            setEditOpen(false);
            setEditing(null);
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message ||
                                error?.message ||
                                intl.formatMessage({ id: "categories.edit_failed" });
            toast.error(errorMessage);
          },
        });
      }}
    >
      <FormField
        id="edit_categoryName"
        label={intl.formatMessage({ id: "categories.name" })}
        value={editForm.categoryName}
        onChange={(e) =>
          setEditForm((f) => ({ ...f, categoryName: e.target.value }))
        }
        required
      />
      <FormField
        id="edit_categoryDescription"
        label={intl.formatMessage({ id: "categories.description" })}
        value={editForm.categoryDescription}
        onChange={(e) =>
          setEditForm((f) => ({
            ...f,
            categoryDescription: e.target.value,
          }))
        }
        required
      />

      <div className="col-span-full flex items-center justify-between border rounded-md p-3">
        <div>
          <Label htmlFor="edit_categoryStatus">{intl.formatMessage({ id: "categories.active" })}</Label>
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: "categories.toggle_status" })}
          </p>
        </div>
        <Switch
          id="edit_categoryStatus"
          checked={editForm.categoryStatus}
          onCheckedChange={(checked) =>
            setEditForm((f) => ({ ...f, categoryStatus: checked }))
          }
        />
      </div>

      <DialogFooter className="mt-4 col-span-full">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {intl.formatMessage({ id: "categories.cancel" })}
          </Button>
        </DialogClose>
        <Button
          type="submit"
          className="text-white"
          disabled={
            !editForm.categoryName || !editForm.categoryDescription || update.isPending
          }
        >
          {update.isPending 
            ? intl.formatMessage({ id: "categories.saving" }) 
            : intl.formatMessage({ id: "categories.save_changes" })
          }
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
{/* Edit Confirmation Dialog */}
<ConfirmationDialog
  open={editConfirmDialog.isOpen}
  onOpenChange={editConfirmDialog.setIsOpen}
  variant="edit"
  onConfirm={editConfirmDialog.handleConfirm}
  onCancel={editConfirmDialog.handleCancel}
  isDestructive={true}
/>
      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          setOpen={setDeleteOpen}
          itemName={toDelete?.categoryName}
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

// AddCategory component
// AddCategory component - استبدال كامل
function AddCategory({
  create,
  isLoading,
}: {
  create: (payload: any) => void;
  isLoading: boolean;
}) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    categoryName: "",
    categoryDescription: "",
    categoryStatus: true,
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

  const canSubmit = form.categoryName.trim() && form.categoryDescription.trim();

  // Check if form has changes
  const hasFormChanges = () => {
    return (
      form.categoryName !== "" ||
      form.categoryDescription !== "" ||
      form.categoryStatus !== true
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
      categoryName: "",
      categoryDescription: "",
      categoryStatus: true,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="text-white cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> {intl.formatMessage({ id: "categories.new_category" })}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "categories.new_category" })}</DialogTitle>
          </DialogHeader>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit || isLoading) return;
              
              create(form);
              setForm({
                categoryName: "",
                categoryDescription: "",
                categoryStatus: true,
              });
              setOpen(false);
            }}
          >
            <FormField
              id="categoryName"
              label={intl.formatMessage({ id: "categories.name" })}
              value={form.categoryName}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryName: e.target.value }))
              }
              required
            />
            <FormField
              id="categoryDescription"
              label={intl.formatMessage({ id: "categories.description" })}
              value={form.categoryDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryDescription: e.target.value }))
              }
              required
            />
            <div className="col-span-full flex items-center justify-between border rounded-md p-3">
              <div>
                <Label htmlFor="categoryStatus">{intl.formatMessage({ id: "categories.active" })}</Label>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: "categories.toggle_status" })}
                </p>
              </div>
              <Switch
                id="categoryStatus"
                checked={form.categoryStatus}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, categoryStatus: checked }))
                }
              />
            </div>
            <DialogFooter className="mt-4 col-span-full">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {intl.formatMessage({ id: "categories.cancel" })}
                </Button>
              </DialogClose>
              <Button type="submit" className="text-white" disabled={!canSubmit || isLoading}>
                {isLoading 
                  ? intl.formatMessage({ id: "categories.saving" }) 
                  : intl.formatMessage({ id: "categories.create" })
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Confirmation Dialog */}
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
