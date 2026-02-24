// CategoryPage.tsx
import { useState } from "react";
import { useIntl } from "react-intl";
import { useLanguage } from "../../context/LanguageContext";
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
  Loader2,
  Image,
  Camera,
  X,
  FolderTree,
  Edit,
} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

// ✅ إضافة SubCategory interface
interface SubCategory {
  _id?: string;
  subCategoryNameAr: string;
  subCategoryNameEn: string;
  subCategoryDescriptionAr: string;
  subCategoryDescriptionEn: string;
  subCategoryStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  _id: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categoryDescriptionAr: string;
  categoryDescriptionEn: string;
  categoryStatus: boolean;
  categoryImage?: string;
  subCategories: SubCategory[]; // ✅ إضافة SubCategories
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoryPage() {
  const intl = useIntl();
  const { isRTL } = useLanguage();

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
      page: 1,
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

  const pagination = {
    currentPage: paginationData.currentPage,
    perPage: paginationData.perPage,
    total: list.data?.count || 0,
    lastPage: paginationData.totalPages,
  };

  // Delete management
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Category | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [editForm, setEditForm] = useState({
    categoryNameAr: "",
    categoryNameEn: "",
    categoryDescriptionAr: "",
    categoryDescriptionEn: "",
    categoryStatus: true,
    categoryImage: "",
    subCategories: [] as SubCategory[], // ✅ إضافة SubCategories
  });

  // ✅ SubCategory management states for edit
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editSubCategoryForm, setEditSubCategoryForm] = useState({
    subCategoryNameAr: "",
    subCategoryNameEn: "",
    subCategoryDescriptionAr: "",
    subCategoryDescriptionEn: "",
    subCategoryStatus: true,
  });

  // تحديث handleEdit
  const handleEdit = (c: Category) => {
    setEditing(c);
    setEditForm({
      categoryNameAr: c.categoryNameAr,
      categoryNameEn: c.categoryNameEn,
      categoryDescriptionAr: c.categoryDescriptionAr,
      categoryDescriptionEn: c.categoryDescriptionEn,
      categoryStatus: Boolean(c.categoryStatus),
      categoryImage: c.categoryImage || "",
      subCategories: c.subCategories || [], // ✅ إضافة SubCategories
    });
    setEditImageFile(null);
    setEditImagePreview(c.categoryImage || "");
    setEditOpen(true);
  };

  // تحديث hasEditFormChanges
  const hasEditFormChanges = () => {
    if (!editing) return false;

    return (
      editForm.categoryNameAr !== editing.categoryNameAr ||
      editForm.categoryNameEn !== editing.categoryNameEn ||
      editForm.categoryDescriptionAr !== editing.categoryDescriptionAr ||
      editForm.categoryDescriptionEn !== editing.categoryDescriptionEn ||
      editForm.categoryStatus !== Boolean(editing.categoryStatus) ||
      editImageFile !== null ||
      editImagePreview !== (editing.categoryImage || "") ||
      JSON.stringify(editForm.subCategories) !== JSON.stringify(editing.subCategories || []) // ✅ فحص تغيير SubCategories
    );
  };

  // تحديث handleEditDialogClose
  const handleEditDialogClose = (open: boolean) => {
    if (!open && hasEditFormChanges()) {
      editConfirmDialog.showDialog();
    } else {
      setEditOpen(false);
      setEditing(null);
      setEditImageFile(null);
      setEditImagePreview("");
      setEditingSubCategory(null); // ✅ إعادة تعيين SubCategory editing
    }
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
      setEditingSubCategory(null); // ✅ إعادة تعيين SubCategory
    },
    onCancel: () => {
      // Handle cancel - stay in dialog
    }
  });

  // ✅ SubCategory management functions
  const handleAddSubCategory = () => {
    const newSubCategory: SubCategory = {
      subCategoryNameAr: "",
      subCategoryNameEn: "",
      subCategoryDescriptionAr: "",
      subCategoryDescriptionEn: "",
      subCategoryStatus: true,
    };
    setEditForm(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, newSubCategory]
    }));
  };

  const handleEditSubCategory = (index: number, subCategory: SubCategory) => {
    setEditingSubCategory({ ...subCategory, _id: index.toString() });
    setEditSubCategoryForm({
      subCategoryNameAr: subCategory.subCategoryNameAr,
      subCategoryNameEn: subCategory.subCategoryNameEn,
      subCategoryDescriptionAr: subCategory.subCategoryDescriptionAr,
      subCategoryDescriptionEn: subCategory.subCategoryDescriptionEn,
      subCategoryStatus: subCategory.subCategoryStatus,
    });
  };

  const handleUpdateSubCategory = (index: number) => {
    const updatedSubCategories = [...editForm.subCategories];
    updatedSubCategories[index] = {
      ...updatedSubCategories[index],
      ...editSubCategoryForm,
    };
    setEditForm(prev => ({
      ...prev,
      subCategories: updatedSubCategories
    }));
    setEditingSubCategory(null);
  };

  const handleDeleteSubCategory = (index: number) => {
    const updatedSubCategories = editForm.subCategories.filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      subCategories: updatedSubCategories
    }));
  };

  // ✅ Image upload helpers
  const handleImageFileChange = (
    file: File | null,
    setImageFile: (file: File | null) => void,
    setImagePreview: (preview: string) => void
  ) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  // ✅ Remove category image
  const handleRemoveCategoryImage = async (categoryId: string) => {
    setUploadingImage(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "categories.removing_image" })
    );

    try {
      await axiosInstance.delete(`/categories/${categoryId}/image`);
      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "categories.image_removed_success" })
      );

      // Refresh the data
      list.refetch();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "categories.remove_image_failed" });
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  // Export Categories Function
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
      const result: any = await axiosInstance.post("/categories/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss(loadingToast);
      console.log("Import result:", result);
      if (result?.results?.categories) {
        const { success, updated, failed } = result?.results?.categories;
        const summary = result?.results?.summary;

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
    <div className={`p-6 space-y-4 !font-tajawal ${isRTL ? 'rtl' : 'ltr'} relative min-h-screen overflow-x-hidden`}>
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
          />
        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "categories.all_categories" })}
        icon={Layers}
        loading={list.isLoading}
        isEmpty={!categories?.length}
        columnCount={8} // ✅ تحديث عدد الأعمدة
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

        // تحديث RenderHead في DataTable
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">#</TableHead>
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "categories.image" })}</TableHead>
            <SortableTH
              sortKey={isRTL ? "categoryNameAr" : "categoryNameEn"}
              label={intl.formatMessage({ id: "categories.name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-4 py-2"
            />
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "categories.description" })}</TableHead>
            <TableHead className="px-4 py-2">{intl.formatMessage({ id: "categories.subcategories" })}</TableHead> {/* ✅ عمود SubCategories */}
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
            <TableHead className="px-4 py-2 text-right">{intl.formatMessage({ id: "categories.actions" })}</TableHead>
          </>
        )}

        // تحديث RenderBody في DataTable
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
                
                {/* ✅ عمود الصورة */}
                <TableCell className="px-4 py-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {c.categoryImage ? (
                      <img
                        src={c.categoryImage}
                        alt={isRTL ? c.categoryNameAr : c.categoryNameEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-medium text-black">
                  {isRTL ? c.categoryNameAr : c.categoryNameEn}
                </TableCell>
                <TableCell className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {isRTL ? c.categoryDescriptionAr : c.categoryDescriptionEn}
                </TableCell>

                {/* ✅ عمود SubCategories */}
                <TableCell className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {c.subCategories?.length || 0}
                    </span>
                    {c.subCategories?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {intl.formatMessage({ id: "categories.subcategories_count" }, { count: c.subCategories.length })}
                      </Badge>
                    )}
                  </div>
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
                    ? new Date(c.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-center'}`}
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
        <DialogContent className="sm:max-w-[500px]" aria-describedby="import-categories-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {intl.formatMessage({ id: "categories.import.title" })}
            </DialogTitle>
            <DialogDescription id="import-categories-description">
              {intl.formatMessage({ id: "categories.import.description" })}
            </DialogDescription>
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {intl.formatMessage({ id: "categories.importing_categories" })}
                </>
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
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto" aria-describedby="view-category-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "categories.category_details" })}
            </DialogTitle>
            <DialogDescription id="view-category-description">
              {intl.formatMessage({ id: "categories.view.description" })}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* ✅ Category Image */}
              {viewing.categoryImage && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.form.image" })}
                  </Label>
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-50 rounded-lg border overflow-hidden">
                      <img
                        src={viewing.categoryImage}
                        alt={isRTL ? viewing.categoryNameAr : viewing.categoryNameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.form.name_ar" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium" dir="rtl">{viewing.categoryNameAr}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.form.name_en" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium" dir="ltr">{viewing.categoryNameEn}</p>
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

              {/* Descriptions */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.form.description_ar" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-gray-800 leading-relaxed" dir="rtl">
                      {viewing.categoryDescriptionAr}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.form.description_en" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-gray-800 leading-relaxed" dir="ltr">
                      {viewing.categoryDescriptionEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ SubCategories Section */}
              {viewing.subCategories && viewing.subCategories.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-600">
                        {intl.formatMessage({ id: "categories.subcategories" })} ({viewing.subCategories.length})
                      </Label>
                    </div>
                    <div className="grid gap-3">
                      {viewing.subCategories.map((sub, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">
                                {intl.formatMessage({ id: "categories.subcategory.name_ar" })}
                              </Label>
                              <p className="font-medium" dir="rtl">{sub.subCategoryNameAr}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                {intl.formatMessage({ id: "categories.subcategory.name_en" })}
                              </Label>
                              <p className="font-medium" dir="ltr">{sub.subCategoryNameEn}</p>
                            </div>
                          </div>
                          {(sub.subCategoryDescriptionAr || sub.subCategoryDescriptionEn) && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {sub.subCategoryDescriptionAr && (
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    {intl.formatMessage({ id: "categories.subcategory.description_ar" })}
                                  </Label>
                                  <p className="text-sm text-gray-700" dir="rtl">{sub.subCategoryDescriptionAr}</p>
                                </div>
                              )}
                              {sub.subCategoryDescriptionEn && (
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    {intl.formatMessage({ id: "categories.subcategory.description_en" })}
                                  </Label>
                                  <p className="text-sm text-gray-700" dir="ltr">{sub.subCategoryDescriptionEn}</p>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                sub.subCategoryStatus
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {sub.subCategoryStatus ? intl.formatMessage({ id: "categories.active" }) : intl.formatMessage({ id: "categories.inactive" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "categories.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString(isRTL ? "ar-EG" : "en-US")
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
                        ? new Date(viewing.updatedAt).toLocaleString(isRTL ? "ar-EG" : "en-US")
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
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto" aria-describedby="edit-category-description">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "categories.edit_category" })}</DialogTitle>
            <DialogDescription id="edit-category-description">
              {intl.formatMessage({ id: "categories.edit.description" })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing) return;
              
              // Validate required fields
              if (!editForm.categoryNameAr || !editForm.categoryNameEn) {
                toast.error(intl.formatMessage({ id: "categories.validation.required_fields" }));
                return;
              }

              // Prepare payload
              let payload: any = editForm;
              if (editImageFile) {
                const formData = new FormData();
                formData.append("categoryImage", editImageFile);
                Object.keys(editForm).forEach((key) => {
                  const value = editForm[key as keyof typeof editForm];
                  if (key === "subCategories") {
                    formData.append(key, JSON.stringify(value));
                  } else {
                    formData.append(key, value as string);
                  }
                });
                payload = formData;
              }
              
              update.mutate({
                id: editing._id,
                payload,
              }, {
                onSuccess: () => {
                  toast.success(intl.formatMessage({ id: "categories.edit_success" }));
                  setEditOpen(false);
                  setEditing(null);
                  setEditImageFile(null);
                  setEditImagePreview("");
                  setEditingSubCategory(null);
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
            {/* ✅ Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({ id: "categories.form.image" })}
              </Label>
              <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-24 h-24 bg-gray-50 rounded-md border overflow-hidden flex items-center justify-center">
                  {editImagePreview ? (
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageFileChange(file, setEditImageFile, setEditImagePreview);
                    }}
                    className="hidden"
                    id="edit-image-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("edit-image-input")?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {editImageFile
                      ? intl.formatMessage({ id: "categories.change_image" })
                      : intl.formatMessage({ id: "categories.upload_image" })}
                  </Button>
                  {(editImagePreview || editImageFile) && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="text-white"
                      size="sm"
                      onClick={() => {
                        setEditImageFile(null);
                        setEditImagePreview("");
                      }}
                    >
                      <X className="w-4 h-4 mr-2 text-white" />
                      {intl.formatMessage({ id: "categories.remove_image" })}
                    </Button>
                  )}
                  {editing?.categoryImage && !editImageFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="text-white"
                      size="sm"
                      onClick={() => handleRemoveCategoryImage(editing._id)}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                      ) : (
                        <Trash className="w-4 h-4 mr-2 text-white" />
                      )}
                      {intl.formatMessage({ id: "categories.remove_from_server" })}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="edit_categoryNameAr"
                label={intl.formatMessage({ id: "categories.form.name_ar" })}
                value={editForm.categoryNameAr}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, categoryNameAr: e.target.value }))
                }
                required
                dir="rtl"
              />

              <FormField
                id="edit_categoryNameEn"
                label={intl.formatMessage({ id: "categories.form.name_en" })}
                value={editForm.categoryNameEn}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, categoryNameEn: e.target.value }))
                }
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-4">
              <FormField
                id="edit_categoryDescriptionAr"
                label={intl.formatMessage({ id: "categories.form.description_ar" })}
                variant="textarea"
                rows={4}
                value={editForm.categoryDescriptionAr}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    categoryDescriptionAr: e.target.value,
                  }))
                }
                dir="rtl"
              />

              <FormField
                id="edit_categoryDescriptionEn"
                label={intl.formatMessage({ id: "categories.form.description_en" })}
                variant="textarea"
                rows={4}
                value={editForm.categoryDescriptionEn}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    categoryDescriptionEn: e.target.value,
                  }))
                }
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between border rounded-md p-3">
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

            {/* ✅ SubCategories Management Section */}
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  <Label className="text-lg font-medium">
                    {intl.formatMessage({ id: "categories.subcategories" })} ({editForm.subCategories.length})
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubCategory}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "categories.add_subcategory" })}
                </Button>
              </div>

              {/* SubCategories List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {editForm.subCategories.map((subCategory, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    {editingSubCategory && editingSubCategory._id === index.toString() ? (
                      /* Edit SubCategory Form */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            id={`subCategoryNameAr_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.name_ar" })}
                            value={editSubCategoryForm.subCategoryNameAr}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryNameAr: e.target.value }))
                            }
                            required
                       
                            dir="rtl"
                          />
                          <FormField
                            id={`subCategoryNameEn_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.name_en" })}
                            value={editSubCategoryForm.subCategoryNameEn}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryNameEn: e.target.value }))
                            }
                            required
                       
                            dir="ltr"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            id={`subCategoryDescriptionAr_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.description_ar" })}
                            variant="textarea"
                            rows={2}
                            value={editSubCategoryForm.subCategoryDescriptionAr}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryDescriptionAr: e.target.value }))
                            }
                       
                            dir="rtl"
                          />
                          <FormField
                            id={`subCategoryDescriptionEn_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.description_en" })}
                            variant="textarea"
                            rows={2}
                            value={editSubCategoryForm.subCategoryDescriptionEn}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryDescriptionEn: e.target.value }))
                            }
                       
                            dir="ltr"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`subCategoryStatus_${index}`}
                              checked={editSubCategoryForm.subCategoryStatus}
                              onCheckedChange={(checked) =>
                                setEditSubCategoryForm((f) => ({ ...f, subCategoryStatus: checked }))
                              }
                            />
                            <Label htmlFor={`subCategoryStatus_${index}`} className="text-sm">
                              {intl.formatMessage({ id: "categories.active" })}
                            </Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSubCategory(null)}
                            >
                              {intl.formatMessage({ id: "categories.cancel" })}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="text-white  hover:bg-primary-600"
                              onClick={() => {
                                handleUpdateSubCategory(index);
                              }}
                              disabled={!editSubCategoryForm.subCategoryNameAr || !editSubCategoryForm.subCategoryNameEn}
                            >
                              {intl.formatMessage({ id: "categories.save" })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display SubCategory */
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-500">
                              {intl.formatMessage({ id: "categories.subcategory.name_ar" })}
                            </Label>
                            <p className="font-medium" dir="rtl">{subCategory.subCategoryNameAr}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              {intl.formatMessage({ id: "categories.subcategory.name_en" })}
                            </Label>
                            <p className="font-medium" dir="ltr">{subCategory.subCategoryNameEn}</p>
                          </div>
                        </div>
                        {(subCategory.subCategoryDescriptionAr || subCategory.subCategoryDescriptionEn) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subCategory.subCategoryDescriptionAr && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {intl.formatMessage({ id: "categories.subcategory.description_ar" })}
                                </Label>
                                <p className="text-sm text-gray-700" dir="rtl">{subCategory.subCategoryDescriptionAr}</p>
                              </div>
                            )}
                            {subCategory.subCategoryDescriptionEn && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {intl.formatMessage({ id: "categories.subcategory.description_en" })}
                                </Label>
                                <p className="text-sm text-gray-700" dir="ltr">{subCategory.subCategoryDescriptionEn}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              subCategory.subCategoryStatus
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {subCategory.subCategoryStatus ? intl.formatMessage({ id: "categories.active" }) : intl.formatMessage({ id: "categories.inactive" })}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSubCategory(index, subCategory)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              {intl.formatMessage({ id: "categories.edit" })}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              className="text-white hover:bg-red-600"
                              size="sm"
                              onClick={() => handleDeleteSubCategory(index)}
                            >
                              <Trash className="w-3 h-3 mr-1 text-white" />
                              {intl.formatMessage({ id: "categories.delete" })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {editForm.subCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{intl.formatMessage({ id: "categories.no_subcategories" })}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddSubCategory}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {intl.formatMessage({ id: "categories.add_first_subcategory" })}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {intl.formatMessage({ id: "categories.cancel" })}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="text-white"
                disabled={
                  !editForm.categoryNameAr || !editForm.categoryNameEn || 
                  update.isPending
                }
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "categories.saving" })}
                  </>
                ) : (
                  intl.formatMessage({ id: "categories.save_changes" })
                )}
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
          itemName={isRTL ? toDelete?.categoryNameAr : toDelete?.categoryNameEn}
          onConfirm={() => {
            if (toDelete) {
              del.mutate(toDelete._id, {
                onSuccess: () => {
                  toast.success(intl.formatMessage({ id: "categories.delete.success" }));
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message ||
                                      error?.message ||
                                      intl.formatMessage({ id: "categories.delete.failed" });
                  toast.error(errorMessage);
                }
              });
            }
            setDeleteOpen(false);
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}

function AddCategory({
  create,
  isLoading,
}: {
  create: UseMutateFunction<AxiosResponse<any>, Error, any>;
  isLoading: boolean;
}) {
  const intl = useIntl();
  const { isRTL } = useLanguage();
  
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    categoryNameAr: "",
    categoryNameEn: "",
    categoryDescriptionAr: "",
    categoryDescriptionEn: "",
    categoryStatus: true,
    categoryImage: "",
    subCategories: [] as SubCategory[], // ✅ إضافة SubCategories
  });

  // ✅ SubCategory management states
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editSubCategoryForm, setEditSubCategoryForm] = useState({
    subCategoryNameAr: "",
    subCategoryNameEn: "",
    subCategoryDescriptionAr: "",
    subCategoryDescriptionEn: "",
    subCategoryStatus: true,
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

  const canSubmit = form.categoryNameAr.trim() && form.categoryNameEn.trim();

  // Check if form has changes
  const hasFormChanges = () => {
    return (
      form.categoryNameAr !== "" ||
      form.categoryNameEn !== "" ||
      form.categoryDescriptionAr !== "" ||
      form.categoryDescriptionEn !== "" ||
      form.categoryStatus !== true ||
      imageFile !== null ||
      imagePreview !== "" ||
      form.subCategories.length > 0 // ✅ فحص SubCategories
    );
  };

  // Handle dialog close with confirmation
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && hasFormChanges() && !isSubmitting) {
      addConfirmDialog.showDialog();
    } else {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      categoryNameAr: "",
      categoryNameEn: "",
      categoryDescriptionAr: "",
      categoryDescriptionEn: "",
      categoryStatus: true,
      categoryImage: "",
      subCategories: [], // ✅ إعادة تعيين SubCategories
    });
    setImageFile(null);
    setImagePreview("");
    setEditingSubCategory(null); // ✅ إعادة تعيين SubCategory editing
  };

  const handleImageFileChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  // ✅ SubCategory management functions
  const handleAddSubCategory = () => {
    const newSubCategory: SubCategory = {
      subCategoryNameAr: "",
      subCategoryNameEn: "",
      subCategoryDescriptionAr: "",
      subCategoryDescriptionEn: "",
      subCategoryStatus: true,
    };
    setForm(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, newSubCategory]
    }));
  };

  const handleEditSubCategory = (index: number, subCategory: SubCategory) => {
    setEditingSubCategory({ ...subCategory, _id: index.toString() });
    setEditSubCategoryForm({
      subCategoryNameAr: subCategory.subCategoryNameAr,
      subCategoryNameEn: subCategory.subCategoryNameEn,
      subCategoryDescriptionAr: subCategory.subCategoryDescriptionAr,
      subCategoryDescriptionEn: subCategory.subCategoryDescriptionEn,
      subCategoryStatus: subCategory.subCategoryStatus,
    });
  };

  const handleUpdateSubCategory = (index: number) => {
    const updatedSubCategories = [...form.subCategories];
    updatedSubCategories[index] = {
      ...updatedSubCategories[index],
      ...editSubCategoryForm,
    };
    setForm(prev => ({
      ...prev,
      subCategories: updatedSubCategories
    }));
    setEditingSubCategory(null);
  };

  const handleDeleteSubCategory = (index: number) => {
    const updatedSubCategories = form.subCategories.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      subCategories: updatedSubCategories
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting || isLoading) return;

    setIsSubmitting(true);

    try {
      // Prepare payload
      let payload: any = form;
      if (imageFile) {
        const formData = new FormData();
        formData.append("categoryImage", imageFile);
        Object.keys(form).forEach((key) => {
          const value = form[key as keyof typeof form];
          if (key !== "categoryImage") {
            if (key === "subCategories") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value as string);
            }
          }
        });
        payload = formData;
      }
      
      // Call create function
      await create(payload);
      
      // Success
      toast.success(intl.formatMessage({ id: "categories.create.success" }));
      resetForm();
      setOpen(false);
      
    } catch (error: any) {
      // Error handling
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          intl.formatMessage({ id: "categories.create.failed" });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || isLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="text-white cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> {intl.formatMessage({ id: "categories.new_category" })}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto" aria-describedby="add-category-description">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "categories.new_category" })}</DialogTitle>
            <DialogDescription id="add-category-description">
              {intl.formatMessage({ id: "categories.create.description" })}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* ✅ Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({ id: "categories.form.image" })}
              </Label>
              <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-24 h-24 bg-gray-50 rounded-md border overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageFileChange(file);
                    }}
                    className="hidden"
                    id="image-input"
                    disabled={isFormLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("image-input")?.click()}
                    disabled={isFormLoading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {imageFile
                      ? intl.formatMessage({ id: "categories.change_image" })
                      : intl.formatMessage({ id: "categories.upload_image" })}
                  </Button>
                  {(imagePreview || imageFile) && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="text-white"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      disabled={isFormLoading}
                    >
                      <X className="w-4 h-4 mr-2 text-white" />
                      {intl.formatMessage({ id: "categories.remove_image" })}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="categoryNameAr"
                label={intl.formatMessage({ id: "categories.form.name_ar" })}
                value={form.categoryNameAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryNameAr: e.target.value }))
                }
                required
                dir="rtl"
                disabled={isFormLoading}
              />

              <FormField
                id="categoryNameEn"
                label={intl.formatMessage({ id: "categories.form.name_en" })}
                value={form.categoryNameEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryNameEn: e.target.value }))
                }
                required
                dir="ltr"
                disabled={isFormLoading}
              />
            </div>

            <div className="space-y-4">
              <FormField
                id="categoryDescriptionAr"
                label={intl.formatMessage({ id: "categories.form.description_ar" })}
                variant="textarea"
                rows={4}
                value={form.categoryDescriptionAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryDescriptionAr: e.target.value }))
                }
                dir="rtl"
                disabled={isFormLoading}
              />

              <FormField
                id="categoryDescriptionEn"
                label={intl.formatMessage({ id: "categories.form.description_en" })}
                variant="textarea"
                rows={4}
                value={form.categoryDescriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryDescriptionEn: e.target.value }))
                }
                dir="ltr"
                disabled={isFormLoading}
              />
            </div>

            <div className="flex items-center justify-between border rounded-md p-3">
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
                disabled={isFormLoading}
              />
            </div>

            {/* ✅ SubCategories Management Section */}
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  <Label className="text-lg font-medium">
                    {intl.formatMessage({ id: "categories.subcategories" })} ({form.subCategories.length})
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubCategory}
                  disabled={isFormLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "categories.add_subcategory" })}
                </Button>
              </div>

              {/* SubCategories List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {form.subCategories.map((subCategory, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    {editingSubCategory && editingSubCategory._id === index.toString() ? (
                      /* Edit SubCategory Form */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            id={`subCategoryNameAr_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.name_ar" })}
                            value={editSubCategoryForm.subCategoryNameAr}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryNameAr: e.target.value }))
                            }
                            required
                      
                            dir="rtl"
                            disabled={isFormLoading}
                          />
                          <FormField
                            id={`subCategoryNameEn_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.name_en" })}
                            value={editSubCategoryForm.subCategoryNameEn}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryNameEn: e.target.value }))
                            }
                            required
                      
                            dir="ltr"
                            disabled={isFormLoading}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            id={`subCategoryDescriptionAr_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.description_ar" })}
                            variant="textarea"
                            rows={2}
                            value={editSubCategoryForm.subCategoryDescriptionAr}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryDescriptionAr: e.target.value }))
                            }
                      
                            dir="rtl"
                            disabled={isFormLoading}
                          />
                          <FormField
                            id={`subCategoryDescriptionEn_${index}`}
                            label={intl.formatMessage({ id: "categories.subcategory.description_en" })}
                            variant="textarea"
                            rows={2}
                            value={editSubCategoryForm.subCategoryDescriptionEn}
                            onChange={(e) =>
                              setEditSubCategoryForm((f) => ({ ...f, subCategoryDescriptionEn: e.target.value }))
                            }
                      
                            dir="ltr"
                            disabled={isFormLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`subCategoryStatus_${index}`}
                              checked={editSubCategoryForm.subCategoryStatus}
                              onCheckedChange={(checked) =>
                                setEditSubCategoryForm((f) => ({ ...f, subCategoryStatus: checked }))
                              }
                              disabled={isFormLoading}
                            />
                            <Label htmlFor={`subCategoryStatus_${index}`} className="text-sm">
                              {intl.formatMessage({ id: "categories.active" })}
                            </Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSubCategory(null)}
                              disabled={isFormLoading}
                            >
                              {intl.formatMessage({ id: "categories.cancel" })}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                handleUpdateSubCategory(index);
                              }}
                              disabled={!editSubCategoryForm.subCategoryNameAr || !editSubCategoryForm.subCategoryNameEn || isFormLoading}
                            >
                              {intl.formatMessage({ id: "categories.save" })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display SubCategory */
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-500">
                              {intl.formatMessage({ id: "categories.subcategory.name_ar" })}
                            </Label>
                            <p className="font-medium" dir="rtl">{subCategory.subCategoryNameAr}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              {intl.formatMessage({ id: "categories.subcategory.name_en" })}
                            </Label>
                            <p className="font-medium" dir="ltr">{subCategory.subCategoryNameEn}</p>
                          </div>
                        </div>
                        {(subCategory.subCategoryDescriptionAr || subCategory.subCategoryDescriptionEn) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subCategory.subCategoryDescriptionAr && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {intl.formatMessage({ id: "categories.subcategory.description_ar" })}
                                </Label>
                                <p className="text-sm text-gray-700" dir="rtl">{subCategory.subCategoryDescriptionAr}</p>
                              </div>
                            )}
                            {subCategory.subCategoryDescriptionEn && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {intl.formatMessage({ id: "categories.subcategory.description_en" })}
                                </Label>
                                <p className="text-sm text-gray-700" dir="ltr">{subCategory.subCategoryDescriptionEn}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              subCategory.subCategoryStatus
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {subCategory.subCategoryStatus ? intl.formatMessage({ id: "categories.active" }) : intl.formatMessage({ id: "categories.inactive" })}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSubCategory(index, subCategory)}
                              disabled={isFormLoading}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              {intl.formatMessage({ id: "categories.edit" })}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteSubCategory(index)}
                              disabled={isFormLoading}
                            >
                              <Trash className="w-3 h-3 mr-1 text-white" />
                              {intl.formatMessage({ id: "categories.delete" })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {form.subCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{intl.formatMessage({ id: "categories.no_subcategories" })}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddSubCategory}
                    disabled={isFormLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {intl.formatMessage({ id: "categories.add_first_subcategory" })}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isFormLoading}>
                  {intl.formatMessage({ id: "categories.cancel" })}
                </Button>
              </DialogClose>
              <Button type="submit" className="text-white" disabled={!canSubmit || isFormLoading}>
                {isFormLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "categories.saving" })}
                  </>
                ) : (
                  intl.formatMessage({ id: "categories.create" })
                )}
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