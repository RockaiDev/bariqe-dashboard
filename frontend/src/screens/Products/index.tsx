// ProductsPage.tsx
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
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Package,
  Pen,
  Plus,
  Trash,
  Download,
  Upload,
  FileDown,
  FileSpreadsheet,
  X,
  Camera,

  Loader2,
} from "lucide-react";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import DataTable, { SortableTH } from "@/components/shared/tabel/tabel";
import Title from "@/components/shared/Title";

import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { FormField } from "@/components/shared/FormField";

import { Label } from "@/components/ui/label";
import { useCrud } from "@/hooks/useCrud";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { toast } from "react-hot-toast";
import axiosInstance from "@/helper/axiosInstance";
import {
  createProductSearchHandler,
  handleCustomDateRange,
} from "@/components/shared/dateFilters";
import {
  createProductFilterGroups,
  handleProductFilters,
} from "@/components/shared/filters";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import productImage from '@/assets/d-koi-5nI9N2wNcBU-unsplash.jpg'
// Updated interfaces to match new schema
interface DiscountTier {
  quantity: number;
  discount: number;
  code: string;
}

interface Product {
  _id: string;
  productNameAr: string;
  productNameEn: string;
  productDescriptionAr: string;
  productDescriptionEn: string;
  productCode: string;
  productPrice: number;
  productCategory:
    | {
        _id: string;
        categoryName: string;
      }
    | string;
  productImage?: string;
  productStatus: boolean;

 
  productForm: "Solid" | "Liquid" | "Gas" | "Powder" | "Granular";
  productDiscount?: number;
  discountTiers?: DiscountTier[];
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  _id: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categoryStatus: boolean;
}

export default function ProductsPage() {
  const intl = useIntl();
  const { isRTL } = useLanguage();

  // Grade and Form options based on schema
  const GRADE_OPTIONS = [
    {
      label: intl.formatMessage({ id: "products.grade.technical" }),
      value: "Technical",
    },
    {
      label: intl.formatMessage({ id: "products.grade.analytical" }),
      value: "Analytical",
    },
    { label: intl.formatMessage({ id: "products.grade.usp" }), value: "USP" },
    { label: intl.formatMessage({ id: "products.grade.fcc" }), value: "FCC" },
    {
      label: intl.formatMessage({ id: "products.grade.cosmetic" }),
      value: "Cosmetic Grade",
    },
  ];

  const FORM_OPTIONS = [
    {
      label: intl.formatMessage({ id: "products.form.solid" }),
      value: "Solid",
    },
    {
      label: intl.formatMessage({ id: "products.form.liquid" }),
      value: "Liquid",
    },
    { label: intl.formatMessage({ id: "products.form.gas" }), value: "Gas" },
    {
      label: intl.formatMessage({ id: "products.form.powder" }),
      value: "Powder",
    },
    {
      label: intl.formatMessage({ id: "products.form.granular" }),
      value: "Granular",
    },
  ];

  // pagination, filters & sorting
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    sorts: [] as Array<{ field: string; direction: "asc" | "desc" }>,
    queries: [],
    search: "",
  });

  const { list, create, update, del } = useCrud("products", filters);
  const { list: categoriesList } = useCrud("categories", { perPage: 100 });

  // State for file upload
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

  // Sort handling
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

  const products: Product[] = list.data?.data || [];
  const categories: Category[] = categoriesList.data?.data || [];
  const activeCategories = categories.filter((cat) => cat.categoryStatus);

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

  // Delete management
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    productNameAr: "",
    productNameEn: "",
    productDescriptionAr: "",
    productDescriptionEn: "",
    productCode: "",
    productPrice: 0,
    productCategory: "",
    productImage: "",
    productStatus: true,


    productForm: "Solid" as Product["productForm"],
    productDiscount: 0,
    discountTiers: [] as DiscountTier[],
  });

  // Image upload states
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Processing states for code validation
  const [checkingEditCode, setCheckingEditCode] = useState(false);

  // Confirmation Dialogs
  const editConfirmDialog = useConfirmationDialog({
    onConfirm: () => {
      setEditOpen(false);
      setEditing(null);
      setEditImageFile(null);
      setEditImagePreview("");
    },
    onCancel: () => {
      // Handle cancel - stay in dialog
    },
  });

  // Function to check if product code exists
  const checkProductCode = async (
    productCode: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const response = await axiosInstance.get(
        `/products/check-code/${productCode}`
      );
      const exists = response.data?.exists;

      // If we're editing, check if the existing product is the same one we're editing
      if (exists && excludeId) {
        const existingProduct = response.data?.product;
        return existingProduct?._id !== excludeId;
      }

      return exists;
    } catch (error) {
      console.error("Error checking product code:", error);
      return false;
    }
  };

  // Check if edit form has changes
  const hasEditFormChanges = () => {
    if (!editing) return false;

    return (
      editForm.productNameAr !== editing.productNameAr ||
      editForm.productNameEn !== editing.productNameEn ||
      editForm.productDescriptionAr !== editing.productDescriptionAr ||
      editForm.productDescriptionEn !== editing.productDescriptionEn ||
      editForm.productCode !== editing.productCode ||
      editForm.productPrice !== editing.productPrice ||
      editForm.productCategory !==
        (typeof editing.productCategory === "object"
          ? editing.productCategory._id
          : editing.productCategory) ||
      editForm.productStatus !== Boolean(editing.productStatus) ||

     
      editForm.productForm !== (editing.productForm || "Solid") ||
      editForm.productDiscount !== (editing.productDiscount || 0) ||
      JSON.stringify(editForm.discountTiers) !==
        JSON.stringify(editing.discountTiers || []) ||
      editImageFile !== null ||
      editImagePreview !== (editing.productImage || "")
    );
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setEditForm({
      productNameAr: p.productNameAr,
      productNameEn: p.productNameEn,
      productDescriptionAr: p.productDescriptionAr,
      productDescriptionEn: p.productDescriptionEn,
      productCode: p.productCode,
      productPrice: p.productPrice,
      productCategory:
        typeof p.productCategory === "object"
          ? p.productCategory._id
          : p.productCategory,
      productImage: p.productImage || "",
      productStatus: Boolean(p.productStatus),

     
      productForm: p.productForm || "Solid",
      productDiscount: p.productDiscount || 0,
      discountTiers: p.discountTiers || [],
    });
    setEditImageFile(null);
    setEditImagePreview(p.productImage || "");
    setEditOpen(true);
  };

  const handleView = (p: Product) => {
    setViewing(p);
    setViewOpen(true);
  };

  // Handle edit dialog close with confirmation
  const handleEditDialogClose = (open: boolean) => {
    if (!open && hasEditFormChanges()) {
      editConfirmDialog.showDialog();
    } else {
      setEditOpen(false);
      setEditing(null);
      setEditImageFile(null);
      setEditImagePreview("");
    }
  };

  // Helper function to get category name
  // Helper function to get category name
  const getCategoryName = (category: any) => {
    if (typeof category === "object" && category) {
      // إذا كانت الفئة object مع اللغتين
      if (category.categoryNameAr && category.categoryNameEn) {
        return isRTL ? category.categoryNameAr : category.categoryNameEn;
      }
    }
    return category || intl.formatMessage({ id: "products.unknown_category" });
  };

  // Image upload helpers
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

  // Change product image only
  const handleChangeProductImage = async (
    productId: string,
    imageFile: File
  ) => {
    setUploadingImage(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "products.uploading_image" })
    );

    try {
      const formData = new FormData();
      formData.append("productImage", imageFile);

      const response = await axiosInstance.put(
        `/products/${productId}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "products.image_updated_success" })
      );

      // Refresh the data
      list.refetch();

      return response.data.newImageUrl;
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "products.upload_image_failed" });
      toast.error(errorMessage);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove product image
  const handleRemoveProductImage = async (productId: string) => {
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "products.removing_image" })
    );

    try {
      await axiosInstance.delete(`/products/${productId}/image`);
      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "products.image_removed_success" })
      );

      // Refresh the data
      list.refetch();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "products.remove_image_failed" });
      toast.error(errorMessage);
    }
  };

  // Export functions
// Export functions
const handleExportProducts = async () => {
  const loadingToast = toast.loading(
    intl.formatMessage({ id: "products.exporting" })
  );

  try {
    // إعداد parameters للإكسبورت مع الفلاتر الحالية
    const exportParams = {
      // إرسال الفلاتر الحالية (بدون pagination)
      sorts: JSON.stringify(filters.sorts),
      queries: JSON.stringify(filters.queries),
      search: filters.search,
      // إزالة pagination parameters للحصول على جميع النتائج المفلترة
      // perPage: undefined,
      // page: undefined,
    };

    const response = await axiosInstance.get("/products/export", {
      params: exportParams, // إرسال الفلاتر كـ query parameters
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
    a.download = `products_export_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    toast.dismiss(loadingToast);
    
    // إضافة رسالة تأكيد تتضمن عدد المنتجات المصدرة
    const filteredCount = products.length;
    const totalCount = pagination.total;
    
    if (filteredCount < totalCount) {
      toast.success(
        intl.formatMessage(
          { id: "products.export_filtered_success" }, 
          { count: filteredCount, total: totalCount }
        )
      );
    } else {
      toast.success(intl.formatMessage({ id: "products.export_success" }));
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      intl.formatMessage({ id: "products.export_failed" });
    toast.error(errorMessage);
    console.error("Export error:", error);
  }
};

  const handleDownloadTemplate = async () => {
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "products.downloading_template" })
    );

    try {
      const response = await axiosInstance.get("/products/download-template", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const blob = new Blob([response.data]);
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Download failed");
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products_import_template.xlsx";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "products.template_downloaded" }));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "products.template_download_failed" });
      toast.error(errorMessage);
      console.error("Download error:", error);
    }
  };

  const handleImportProducts = async () => {
    if (!selectedFile) {
      toast.error(intl.formatMessage({ id: "products.select_file_error" }));
      return;
    }

    setImporting(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "products.importing" })
    );

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axiosInstance.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);

      const results: any = response;
      console.log("Import results:", results);
      if (results) {
        const { products, summary, errors } = results?.results

        if (products?.success?.length > 0) {
          toast.success(
            intl.formatMessage(
              { id: "products.import_success_count" },
              { count: products.success.length }
            )
          );
        }
        if (products?.updated?.length > 0) {
          toast.success(
            intl.formatMessage(
              { id: "products.import_updated_count" },
              { count: products.updated.length }
            )
          );
        }
        if (products?.failed?.length > 0) {
          toast.error(
            intl.formatMessage(
              { id: "products.import_failed_count" },
              { count: products.failed.length }
            )
          );
          products.failed.slice(0, 5).forEach((failure: any) => {
            const code = failure.productCode || "Unknown";
            const error = failure.error || "Unknown error";
            toast.error(`Failed: ${code} - ${error}`);
          });
        }

        if (errors?.length > 0) {
          toast.error(
            intl.formatMessage(
              { id: "products.import_validation_errors" },
              { count: errors.length }
            )
          );
          errors.slice(0, 5).forEach((err: any) => {
            const row = err.row || "Unknown row";
            const code = err.productCode || err.productName || "Unknown";
            toast.error(`Row ${row}: ${code} - ${err.error}`);
          });
        }

        if (summary) {
          toast(
            intl.formatMessage(
              {
                id: "products.import_summary",
              },
              {
                success: summary.success,
                updated: summary.updated,
                failed: summary.failed,
              }
            )
          );
        }
      }

      setImportDialogOpen(false);
      setSelectedFile(null);
      list.refetch();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        intl.formatMessage({ id: "products.import_failed" });
      toast.error(errorMessage);
      console.error("Import error:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className={`p-6 space-y-4 !font-tajawal ${
        isRTL ? "rtl" : "ltr"
      } relative min-h-screen overflow-x-hidden`}
    >
      <div className="flex justify-between items-center mb-3 md:flex-row flex-col gap-3">
        <Title
          title={intl.formatMessage({ id: "products.title" })}
          subtitle={intl.formatMessage({ id: "products.subtitle" })}
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
                onClick={handleExportProducts}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "products.export_all" })}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setImportDialogOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "products.import" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Product Button */}
          <AddProduct
            create={create}
            isLoading={create.isPending}
            categories={activeCategories}
            checkProductCode={checkProductCode}
            gradeOptions={GRADE_OPTIONS}
            formOptions={FORM_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        title={intl.formatMessage({ id: "products.management_title" })}
        icon={Package}
        loading={list.isLoading}
        isEmpty={!products?.length}
        columnCount={11}
        pagination={pagination}
        dateFilterAble={true}
        sort={currentSort}
        onSortChange={handleSortChange}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        onPerPageChange={(perPage) =>
          setFilters((f) => ({ ...f, perPage, page: 1 }))
        }
        searchProps={{
          placeholder: intl.formatMessage({
            id: "products.search_placeholder",
          }),
          onKeyDown: createProductSearchHandler(ChangeFilter),
        }}
        // في ProductsPage.tsx
        filterGroups={createProductFilterGroups(
          activeCategories,
          (key: string) => intl.formatMessage({ id: key }),
          isRTL
        )}
        onFiltersApply={(filters, dateFilter) => {
          // تطبيق فلاتر التاريخ
          if (dateFilter) {
            handleCustomDateRange(dateFilter, ChangeFilter);
          } else {
            handleCustomDateRange(null, ChangeFilter);
          }

          // تطبيق باقي الفلاتر
          Object.entries(filters).forEach(([filterKey, filterValue]) => {
            handleProductFilters(filterKey, filterValue, ChangeFilter);
          });
        }}
        RenderHead={({ sort, onSortChange }) => (
          <>
            <TableHead className="text-right">#</TableHead>
            {/* Non-sortable column */}
            <TableHead className="px-2 sm:px-4 py-2">
              {intl.formatMessage({ id: "products.table.image" })}
            </TableHead>

            {/* Sortable columns */}
            <SortableTH
              sortKey="productCode"
              label={intl.formatMessage({ id: "products.table.code" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

            <SortableTH
              sortKey={isRTL ? "productNameAr" : "productNameEn"}
              label={intl.formatMessage({ id: "products.table.name" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

            <SortableTH
              sortKey="productCategory"
              label={intl.formatMessage({ id: "products.table.category" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

     

            <SortableTH
              sortKey="productPrice"
              label={intl.formatMessage({ id: "products.table.price" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

      

            <SortableTH
              sortKey="productForm"
              label={intl.formatMessage({ id: "products.table.form" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

            <SortableTH
              sortKey="productStatus"
              label={intl.formatMessage({ id: "products.table.status" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

            <SortableTH
              sortKey="createdAt"
              label={intl.formatMessage({ id: "products.table.date" })}
              sort={sort}
              onSortChange={onSortChange}
              className="px-2 sm:px-4 py-2"
            />

            {/* Non-sortable actions column */}
            <TableHead className="px-2 sm:px-4 py-2 text-right">
              {intl.formatMessage({ id: "common.actions" })}
            </TableHead>
          </>
        )}
        RenderBody={({ getRowColor }) => (
          <>
            {products.map((p, i) => (
              <TableRow
                key={p._id}
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
                onClick={() => handleView(p)}
              >
                <TableCell className="text-right">{i + 1}</TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 mx-auto flex items-center justify-center">
                    {p.productImage ? (
                      <img
                        src={p.productImage}
                        alt={isRTL ? p.productNameAr : p.productNameEn}
                        className="w-full h-full object-cover"
                     
                      />
                    ) : (
                     <img
                        src={productImage}
                        alt={isRTL ? p.productNameAr : p.productNameEn}
                        className="w-full h-full object-cover"
                      
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {p.productCode}
                </TableCell>
                <TableCell className="font-medium text-black">
                  {isRTL ? p.productNameAr : p.productNameEn}
                </TableCell>
                <TableCell className="w-4">
                  {getCategoryName(p.productCategory)}
                </TableCell>
              
                <TableCell className="font-semibold">
                  {p.productPrice?.toFixed(2)} EGP
                </TableCell>
              
                <TableCell className="text-center">
                  {FORM_OPTIONS.find((f) => f.value === p.productForm)?.label ||
                    p.productForm}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium !text-nowrap ${
                      p.productStatus
                        ? "bg-green-100 text-green-700 border rounded-lg border-green-700"
                        : "bg-red-100 text-red-700 border rounded-lg border-red-700"
                    }`}
                  >
                    {p.productStatus
                      ? intl.formatMessage({ id: "products.status.in_stock" })
                      : intl.formatMessage({
                          id: "products.status.out_of_stock",
                        })}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString(
                        isRTL ? "ar-EG" : "en-US",
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
                    className={`flex items-center gap-2 ${
                      isRTL ? "justify-start" : "justify-center"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(p);
                      }}
                    >
                      <Pen className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(p);
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

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
          aria-describedby="view-product-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {intl.formatMessage({ id: "products.view.title" })}
            </DialogTitle>
            <DialogDescription id="view-product-description">
              {intl.formatMessage({ id: "products.view.description" })}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-6">
              {/* Product Image */}
              {viewing.productImage && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.image" })}
                  </Label>
                  <div
                    className={`flex items-center gap-4 ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="w-32 h-32 bg-gray-50 rounded-md border overflow-hidden">
                      <img
                        src={viewing.productImage || productImage}
                        alt={
                          isRTL ? viewing.productNameAr : viewing.productNameEn
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleChangeProductImage(viewing._id, file);
                          }
                        }}
                        className="hidden"
                        id="change-image-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("change-image-input")?.click()
                        }
                        disabled={uploadingImage}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadingImage
                          ? intl.formatMessage({ id: "products.uploading" })
                          : intl.formatMessage({ id: "products.change_image" })}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-white"
                        onClick={() => handleRemoveProductImage(viewing._id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {intl.formatMessage({ id: "products.remove_image" })}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.code" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-mono font-medium">
                      {viewing.productCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.name_ar" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium" dir="rtl">
                      {viewing.productNameAr}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.name_en" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium" dir="ltr">
                      {viewing.productNameEn}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.category" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      {getCategoryName(viewing.productCategory)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.price" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-bold text-lg text-green-600">
                      {viewing.productPrice?.toFixed(2)} EGP
                    </p>
                  </div>
                </div>

        

    

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.form" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {FORM_OPTIONS.find((f) => f.value === viewing.productForm)
                      ?.label || viewing.productForm}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.status" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewing.productStatus
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {viewing.productStatus
                        ? intl.formatMessage({ id: "products.status.in_stock" })
                        : intl.formatMessage({
                            id: "products.status.out_of_stock",
                          })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.description_ar" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-gray-800 leading-relaxed" dir="rtl">
                      {viewing.productDescriptionAr}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.form.description_en" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-gray-800 leading-relaxed" dir="ltr">
                      {viewing.productDescriptionEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* General Discount */}
              {viewing.productDiscount && viewing.productDiscount > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({
                      id: "products.form.general_discount",
                    })}
                  </Label>
                  <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-yellow-800 font-medium">
                      {viewing.productDiscount}%
                      {intl.formatMessage({ id: "products.discount.off" })}
                    </p>
                  </div>
                </div>
              )}

              {/* Discount Tiers */}
              {viewing.discountTiers && viewing.discountTiers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({
                      id: "products.form.tiered_discounts",
                    })}
                  </Label>
                  <div className="bg-blue-50 rounded-md border border-blue-200 p-4">
                    <div className="space-y-2">
                      {viewing.discountTiers
                        .sort((a, b) => a.quantity - b.quantity)
                        .map((tier, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-white rounded"
                          >
                            <span className="text-sm">
                              {intl.formatMessage(
                                { id: "products.discount.buy_units" },
                                { quantity: tier.quantity }
                              )}
                            </span>
                            <span className="font-medium text-blue-600">
                              {tier.discount}%{" "}
                              {intl.formatMessage({
                                id: "products.discount.off",
                              })}
                            </span>
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
                    {intl.formatMessage({ id: "products.view.created_at" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleString(
                            isRTL ? "ar-EG" : "en-US"
                          )
                        : intl.formatMessage({
                            id: "products.view.not_available",
                          })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    {intl.formatMessage({ id: "products.view.last_updated" })}
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">
                      {viewing.updatedAt
                        ? new Date(viewing.updatedAt).toLocaleString(
                            isRTL ? "ar-EG" : "en-US"
                          )
                        : intl.formatMessage({
                            id: "products.view.not_available",
                          })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  {intl.formatMessage({ id: "products.view.product_id" })}
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
                  {intl.formatMessage({ id: "common.close" })}
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
                {intl.formatMessage({ id: "products.edit_product" })}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
          aria-describedby="edit-product-description"
        >
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage({ id: "products.edit.title" })}
            </DialogTitle>
            <DialogDescription id="edit-product-description">
              {intl.formatMessage({ id: "products.edit.description" })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editing) return;

              // Validate basic form data
              if (
                !editForm.productCode ||
                !editForm.productNameAr ||
                !editForm.productNameEn ||
                !editForm.productDescriptionAr ||
                !editForm.productDescriptionEn ||
                !editForm.productCategory ||
                editForm.productPrice <= 0 
              
              ) {
                toast.error(
                  intl.formatMessage({
                    id: "products.validation.required_fields",
                  })
                );
                return;
              }

              // Validate discount tiers have the same code
              const validTiers = editForm.discountTiers.every(
                (tier) => tier.code === editForm.productCode
              );

              if (!validTiers) {
                toast.error(
                  intl.formatMessage({
                    id: "products.validation.discount_tiers_code",
                  })
                );
                return;
              }

              // Check if product code exists (only if it changed)
              if (editForm.productCode !== editing.productCode) {
                setCheckingEditCode(true);
                try {
                  const codeExists = await checkProductCode(
                    editForm.productCode,
                    editing._id
                  );
                  if (codeExists) {
                    toast.error(
                      intl.formatMessage({
                        id: "products.validation.code_exists",
                      })
                    );
                    setCheckingEditCode(false);
                    return;
                  }
                } catch (error) {
                  toast.error(
                    intl.formatMessage({
                      id: "products.validation.code_check_failed",
                    })
                  );
                  setCheckingEditCode(false);
                  return;
                }
                setCheckingEditCode(false);
              }

              const payload = { ...editForm };
              let data: any = payload;

              if (editImageFile) {
                const formData = new FormData();
                formData.append("productImage", editImageFile);
                Object.keys(payload).forEach((key) => {
                  const value = payload[key as keyof typeof payload];
                  if (key === "discountTiers") {
                    formData.append(key, JSON.stringify(value));
                  } else {
                    formData.append(key, value as string);
                  }
                });
                data = formData;
              }

              update.mutate(
                { id: editing._id, payload: data },
                {
                  onSuccess: () => {
                    toast.success(
                      intl.formatMessage({ id: "products.edit.success" })
                    );
                    setEditOpen(false);
                    setEditing(null);
                    setEditImageFile(null);
                    setEditImagePreview("");
                  },
                  onError: (error: any) => {
                    const errorMessage =
                      error?.response?.data?.message ||
                      error?.message ||
                      intl.formatMessage({ id: "products.edit.failed" });
                    toast.error(errorMessage);
                  },
                }
              );
            }}
          >
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({ id: "products.form.image" })}
              </Label>
              <div
                className={`flex items-center gap-4 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-24 h-24 bg-gray-50 rounded-md border overflow-hidden flex items-center justify-center">
                  {editImagePreview ? (
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                        src={productImage}
                        alt={isRTL ? editForm.productNameAr : editForm.productNameEn}
                        className="w-full h-full object-cover"
                      
                      />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageFileChange(
                        file,
                        setEditImageFile,
                        setEditImagePreview
                      );
                    }}
                    className="hidden"
                    id="edit-image-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("edit-image-input")?.click()
                    }
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {editImageFile
                      ? intl.formatMessage({ id: "products.change_image" })
                      : intl.formatMessage({ id: "products.upload_image" })}
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
                        setEditForm((f) => ({ ...f, productImage: "" }));
                      }}
                    >
                      <X className="w-4 h-4 mr-2 text-white" />
                      {intl.formatMessage({ id: "products.remove_image" })}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="edit_productCode"
                label={intl.formatMessage({ id: "products.form.code" })}
                value={editForm.productCode}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    productCode: e.target.value,
                    discountTiers: f.discountTiers.map((tier) => ({
                      ...tier,
                      code: e.target.value,
                    })),
                  }))
                }
                required
              />

              <FormField
                id="edit_productNameAr"
                label={intl.formatMessage({ id: "products.form.name_ar" })}
                value={editForm.productNameAr}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, productNameAr: e.target.value }))
                }
                required
                dir="rtl"
              />

              <FormField
                id="edit_productNameEn"
                label={intl.formatMessage({ id: "products.form.name_en" })}
                value={editForm.productNameEn}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, productNameEn: e.target.value }))
                }
                required
                dir="ltr"
              />

              {/* Category Selector */}
              <div className="space-y-2">
                <Label htmlFor="edit_productCategory">
                  {intl.formatMessage({ id: "products.form.category" })}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editForm.productCategory}
                  onValueChange={(value) =>
                    setEditForm((f) => ({ ...f, productCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "products.form.select_category",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                           {isRTL
                          ? category.categoryNameAr 
                          : category.categoryNameEn }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="edit_productPrice"
                label={intl.formatMessage({ id: "products.form.price" })}
                type="number"
                step="0.01"
                min="0"
                value={editForm.productPrice}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    productPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />

        

    

              {/* Form Selector */}
              <div className="space-y-2">
                <Label htmlFor="edit_productForm">
                  {intl.formatMessage({ id: "products.form.form" })}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editForm.productForm}
                  onValueChange={(value) =>
                    setEditForm((f) => ({ ...f, productForm: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "products.form.select_form",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="edit_productDiscount"
                label={intl.formatMessage({
                  id: "products.form.general_discount_percent",
                })}
                type="number"
                min="0"
                max="100"
                value={editForm.productDiscount}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    productDiscount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="col-span-full space-y-4">
              <FormField
                id="edit_productDescriptionAr"
                label={intl.formatMessage({
                  id: "products.form.description_ar",
                })}
                variant="textarea"
                rows={4}
                value={editForm.productDescriptionAr}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    productDescriptionAr: e.target.value,
                  }))
                }
                required
                dir="rtl"
              />

              <FormField
                id="edit_productDescriptionEn"
                label={intl.formatMessage({
                  id: "products.form.description_en",
                })}
                variant="textarea"
                rows={4}
                value={editForm.productDescriptionEn}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    productDescriptionEn: e.target.value,
                  }))
                }
                required
                dir="ltr"
              />
            </div>

            {/* Discount Tiers Section */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({ id: "products.form.tiered_discounts" })}
              </Label>
              <div className="border rounded-md p-4 space-y-3">
                {editForm.discountTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    {/* Quantity */}
                    <div className="col-span-5 space-y-1">
                      <Label
                        htmlFor={`edit-quantity-${index}`}
                        className="text-xs font-medium text-gray-700"
                      >
                        {intl.formatMessage({ id: "products.form.quantity" })}
                      </Label>
                      <Input
                        id={`edit-quantity-${index}`}
                        type="number"
                        placeholder={intl.formatMessage({
                          id: "products.form.quantity",
                        })}
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => {
                          const newTiers = [...editForm.discountTiers];
                          newTiers[index] = {
                            ...newTiers[index],
                            quantity: parseInt(e.target.value) || 0,
                          };
                          setEditForm((f) => ({
                            ...f,
                            discountTiers: newTiers,
                          }));
                        }}
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-5 space-y-1">
                      <Label
                        htmlFor={`edit-discount-${index}`}
                        className="text-xs font-medium text-gray-700"
                      >
                        {intl.formatMessage({
                          id: "products.form.discount_percent",
                        })}
                      </Label>
                      <Input
                        id={`edit-discount-${index}`}
                        type="number"
                        placeholder={intl.formatMessage({
                          id: "products.form.discount_percent",
                        })}
                        min="0"
                        max="100"
                        value={tier.discount}
                        onChange={(e) => {
                          const newTiers = [...editForm.discountTiers];
                          newTiers[index] = {
                            ...newTiers[index],
                            discount: parseFloat(e.target.value) || 0,
                          };
                          setEditForm((f) => ({
                            ...f,
                            discountTiers: newTiers,
                          }));
                        }}
                      />
                    </div>

                    {/* Remove button */}
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newTiers = editForm.discountTiers.filter(
                            (_, i) => i !== index
                          );
                          setEditForm((f) => ({
                            ...f,
                            discountTiers: newTiers,
                          }));
                        }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add new tier */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditForm((f) => ({
                      ...f,
                      discountTiers: [
                        ...f.discountTiers,
                        { quantity: 0, discount: 0, code: f.productCode },
                      ],
                    }));
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {intl.formatMessage({
                    id: "products.form.add_discount_tier",
                  })}
                </Button>
              </div>
            </div>

            <div className="col-span-full flex items-center justify-between border rounded-md p-3">
              <div>
                <Label htmlFor="edit_productStatus">
                  {intl.formatMessage({ id: "products.form.stock_status" })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({
                    id: "products.form.stock_status_description",
                  })}
                </p>
              </div>
              <Switch
                id="edit_productStatus"
                checked={editForm.productStatus}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, productStatus: checked }))
                }
              />
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {intl.formatMessage({ id: "common.cancel" })}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="text-white"
                disabled={
                  !editForm.productCode ||
                  !editForm.productNameAr ||
                  !editForm.productNameEn ||
                  !editForm.productDescriptionAr ||
                  !editForm.productDescriptionEn ||
                  !editForm.productCategory ||
                  editForm.productPrice <= 0 ||
          
                  checkingEditCode ||
                  update.isPending
                }
              >
                {checkingEditCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "products.checking_code" })}
                  </>
                ) : update.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "products.updating" })}
                  </>
                ) : (
                  intl.formatMessage({ id: "products.save_changes" })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          aria-describedby="import-products-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {intl.formatMessage({ id: "products.import.title" })}
            </DialogTitle>
            <DialogDescription id="import-products-description">
              {intl.formatMessage({ id: "products.import.description" })}
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
                {intl.formatMessage({
                  id: "products.import.download_template",
                })}
              </Button>
              <h4 className="font-semibold text-blue-900 mb-2">
                {intl.formatMessage({
                  id: "products.import.instructions_title",
                })}
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_1" })}
                </li>
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_2" })}
                </li>
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_3" })}
                </li>
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_4" })}
                </li>
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_5" })}
                </li>
                <li>
                  {intl.formatMessage({ id: "products.import.instruction_6" })}
                </li>
              </ol>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>
                {intl.formatMessage({ id: "products.import.select_file" })}
              </Label>
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
                  {intl.formatMessage({ id: "products.import.selected_file" })}:{" "}
                  {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={importing}>
                {intl.formatMessage({ id: "common.cancel" })}
              </Button>
            </DialogClose>
            <Button
              onClick={handleImportProducts}
              disabled={!selectedFile || importing}
              className="text-white"
            >
              {importing ? (
                <>{intl.formatMessage({ id: "products.importing" })}</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "products.import_button" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          setOpen={setDeleteOpen}
          itemName={isRTL ? toDelete?.productNameAr : toDelete?.productNameEn}
          onConfirm={() => {
            if (toDelete) {
              del.mutate(toDelete._id, {
                onSuccess: () => {
                  toast.success(
                    intl.formatMessage({ id: "products.delete.success" })
                  );
                },
                onError: (error: any) => {
                  const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    intl.formatMessage({ id: "products.delete.failed" });
                  toast.error(errorMessage);
                },
              });
            }
            setDeleteOpen(false);
            setToDelete(null);
          }}
        />
      )}

      {/* Edit Confirmation Dialog */}
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
// Add Product Dialog Component with Product Code Validation
function AddProduct({
  create,
  isLoading,
  categories,
  checkProductCode,

  formOptions,
}: {
  create: any;
  isLoading: boolean;
  categories: Category[];
  checkProductCode: (code: string) => Promise<boolean>;
  gradeOptions: { label: string; value: string }[];
  formOptions: { label: string; value: string }[];
}) {
  const intl = useIntl();
  const { isRTL } = useLanguage();

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [form, setForm] = useState({
    productNameAr: "",
    productNameEn: "",
    productDescriptionAr: "",
    productDescriptionEn: "",
    productCode: "",
    productPrice: 0,
    productCategory: "",
    productImage: "",
    productStatus: true,


    productForm: "Solid" as const,
    productDiscount: 0,
    discountTiers: [] as DiscountTier[],
  });

  // Add Dialog Confirmation
  const addConfirmDialog = useConfirmationDialog({
    onConfirm: () => {
      setOpen(false);
      resetForm();
    },
    onCancel: () => {
      // Stay in dialog
    },
  });

  const canSubmit =
    form.productCode.trim() &&
    form.productNameAr.trim() &&
    form.productNameEn.trim() &&
    form.productDescriptionAr.trim() &&
    form.productDescriptionEn.trim() &&
    form.productCategory.trim() &&
    form.productPrice > 0 
  

  // Check if form has changes
  const hasFormChanges = () => {
    return (
      form.productNameAr !== "" ||
      form.productNameEn !== "" ||
      form.productDescriptionAr !== "" ||
      form.productDescriptionEn !== "" ||
      form.productCode !== "" ||
      form.productPrice !== 0 ||
      form.productCategory !== "" ||
  
   
      form.productForm !== "Solid" ||
      form.productDiscount !== 0 ||
      form.discountTiers.length > 0 ||
      imageFile !== null ||
      imagePreview !== ""
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
      productNameAr: "",
      productNameEn: "",
      productDescriptionAr: "",
      productDescriptionEn: "",
      productCode: "",
      productPrice: 0,
      productCategory: "",
      productImage: "",
      productStatus: true,
    
  
      productForm: "Solid",
      productDiscount: 0,
      discountTiers: [],
    });
    setImageFile(null);
    setImagePreview("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    // Validate discount tiers have the same code
    const validTiers = form.discountTiers.every(
      (tier) => tier.code === form.productCode
    );

    if (!validTiers) {
      toast.error(
        intl.formatMessage({ id: "products.validation.discount_tiers_code" })
      );
      return;
    }

    // Check if product code exists
    setCheckingCode(true);
    try {
      const codeExists = await checkProductCode(form.productCode);
      if (codeExists) {
        toast.error(
          intl.formatMessage({ id: "products.validation.code_exists" })
        );
        setCheckingCode(false);
        return;
      }
    } catch (error) {
      toast.error(
        intl.formatMessage({ id: "products.validation.code_check_failed" })
      );
      setCheckingCode(false);
      return;
    }
    setCheckingCode(false);

    // Clean up form data - remove empty strings and filter valid tiers
    const cleanForm = {
      ...form,
      discountTiers: form.discountTiers.filter(
        (tier) => tier.quantity > 0 && tier.discount > 0
      ),
    };

    // Remove empty optional fields
    if (!cleanForm.productImage) delete (cleanForm as any).productImage;
    if (!cleanForm.productDiscount) delete (cleanForm as any).productDiscount;
    if (cleanForm.discountTiers.length === 0)
      delete (cleanForm as any).discountTiers;

    let payload: any = cleanForm;
    if (imageFile) {
      const formData = new FormData();
      formData.append("productImage", imageFile);
      Object.keys(cleanForm).forEach((key) => {
        const value = cleanForm[key as keyof typeof cleanForm];
        if (key === "discountTiers") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });
      payload = formData;
    }

    create.mutate(payload, {
      onSuccess: () => {
        toast.success(intl.formatMessage({ id: "products.create.success" }));
        setForm({
          productNameAr: "",
          productNameEn: "",
          productDescriptionAr: "",
          productDescriptionEn: "",
          productCode: "",
          productPrice: 0,
          productCategory: "",
          productImage: "",
          productStatus: true,
  
  
          productForm: "Solid",
          productDiscount: 0,
          discountTiers: [],
        });
        setImageFile(null);
        setImagePreview("");
        setOpen(false);
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          intl.formatMessage({ id: "products.create.failed" });
        toast.error(errorMessage);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="text-white cursor-pointer">
            {intl.formatMessage({ id: "products.add_product" })}{" "}
            <Plus className="w-4 h-4 ml-2" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
          aria-describedby="add-product-description"
        >
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage({ id: "products.create.title" })}
            </DialogTitle>
            <DialogDescription id="add-product-description">
              {intl.formatMessage({ id: "products.create.description" })}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({ id: "products.form.image" })}
              </Label>
              <div
                className={`flex items-center gap-4 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-24 h-24 bg-gray-50 rounded-md border overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                  <img
                        src={productImage}
                        alt={isRTL ? form.productNameAr : form.productNameEn}
                        className="w-full h-full object-cover"
                      
                      />
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("image-input")?.click()
                    }
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {imageFile
                      ? intl.formatMessage({ id: "products.change_image" })
                      : intl.formatMessage({ id: "products.upload_image" })}
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
                    >
                      <X className="w-4 h-4 mr-2 text-white" />
                      {intl.formatMessage({ id: "products.remove_image" })}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="productCode"
                label={intl.formatMessage({ id: "products.form.code" })}
                value={form.productCode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productCode: e.target.value,
                    discountTiers: f.discountTiers.map((tier) => ({
                      ...tier,
                      code: e.target.value,
                    })),
                  }))
                }
                required
              />

              <FormField
                id="productNameAr"
                label={intl.formatMessage({ id: "products.form.name_ar" })}
                value={form.productNameAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productNameAr: e.target.value }))
                }
                required
                dir="rtl"
              />

              <FormField
                id="productNameEn"
                label={intl.formatMessage({ id: "products.form.name_en" })}
                value={form.productNameEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productNameEn: e.target.value }))
                }
                required
                dir="ltr"
              />

              {/* Category Selector */}
              <div className="space-y-2">
                <Label htmlFor="productCategory">
                  {intl.formatMessage({ id: "products.form.category" })}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.productCategory}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, productCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "products.form.select_category",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {isRTL
                          ? category.categoryNameAr 
                          : category.categoryNameEn }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="productPrice"
                label={intl.formatMessage({ id: "products.form.price" })}
                type="number"
                step="0.01"
                min="0"
                value={form.productPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />

           


              {/* Form Selector */}
              <div className="space-y-2">
                <Label htmlFor="productForm">
                  {intl.formatMessage({ id: "products.form.form" })}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.productForm}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, productForm: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "products.form.select_form",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.map((formOption) => (
                      <SelectItem
                        key={formOption.value}
                        value={formOption.value}
                      >
                        {formOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="productDiscount"
                label={intl.formatMessage({
                  id: "products.form.general_discount_percent",
                })}
                type="number"
                min="0"
                max="100"
                value={form.productDiscount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productDiscount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="col-span-full space-y-4">
              <FormField
                id="productDescriptionAr"
                label={intl.formatMessage({
                  id: "products.form.description_ar",
                })}
                variant="textarea"
                rows={4}
                value={form.productDescriptionAr}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productDescriptionAr: e.target.value,
                  }))
                }
                required
                dir="rtl"
              />

              <FormField
                id="productDescriptionEn"
                label={intl.formatMessage({
                  id: "products.form.description_en",
                })}
                variant="textarea"
                rows={4}
                value={form.productDescriptionEn}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productDescriptionEn: e.target.value,
                  }))
                }
                required
                dir="ltr"
              />
            </div>

            {/* Discount Tiers Section */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-medium">
                {intl.formatMessage({
                  id: "products.form.tiered_discounts_optional",
                })}
              </Label>
              <div className="border rounded-md p-4 space-y-3">
                {form.discountTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    {/* Quantity */}
                    <div className="col-span-5 space-y-1">
                      <Label
                        htmlFor={`quantity-${index}`}
                        className="text-xs font-medium text-gray-700"
                      >
                        {intl.formatMessage({ id: "products.form.quantity" })}
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        placeholder={intl.formatMessage({
                          id: "products.form.quantity",
                        })}
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => {
                          const newTiers = [...form.discountTiers];
                          newTiers[index] = {
                            ...newTiers[index],
                            quantity: parseInt(e.target.value) || 0,
                          };
                          setForm((f) => ({ ...f, discountTiers: newTiers }));
                        }}
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-5 space-y-1">
                      <Label
                        htmlFor={`discount-${index}`}
                        className="text-xs font-medium text-gray-700"
                      >
                        {intl.formatMessage({
                          id: "products.form.discount_percent",
                        })}
                      </Label>
                      <Input
                        id={`discount-${index}`}
                        type="number"
                        placeholder={intl.formatMessage({
                          id: "products.form.discount_percent",
                        })}
                        min="0"
                        max="100"
                        value={tier.discount}
                        onChange={(e) => {
                          const newTiers = [...form.discountTiers];
                          newTiers[index] = {
                            ...newTiers[index],
                            discount: parseFloat(e.target.value) || 0,
                          };
                          setForm((f) => ({ ...f, discountTiers: newTiers }));
                        }}
                      />
                    </div>

                    {/* Remove button */}
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newTiers = form.discountTiers.filter(
                            (_, i) => i !== index
                          );
                          setForm((f) => ({ ...f, discountTiers: newTiers }));
                        }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add new tier */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      discountTiers: [
                        ...f.discountTiers,
                        { quantity: 0, discount: 0, code: f.productCode },
                      ],
                    }));
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {intl.formatMessage({
                    id: "products.form.add_discount_tier",
                  })}
                </Button>
              </div>
            </div>

            <div className="col-span-full flex items-center justify-between border rounded-md p-3">
              <div>
                <Label htmlFor="productStatus">
                  {intl.formatMessage({ id: "products.form.stock_status" })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({
                    id: "products.form.stock_status_description",
                  })}
                </p>
              </div>
              <Switch
                id="productStatus"
                checked={form.productStatus}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, productStatus: checked }))
                }
              />
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {intl.formatMessage({ id: "common.cancel" })}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="text-white"
                disabled={!canSubmit || checkingCode || isLoading}
              >
                {checkingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "products.checking_code" })}
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "products.creating" })}
                  </>
                ) : (
                  intl.formatMessage({ id: "products.create_product" })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Confirmation Dialog */}
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
