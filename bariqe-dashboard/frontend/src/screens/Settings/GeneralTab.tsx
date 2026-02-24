import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import SectionCard from "./SectionCard";
import useAuth from "@/hooks/useAuth";
import axios from "@/helper/axiosInstance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DatabaseBackup,

  Upload,

  X,
  FileDown,
} from "lucide-react";
import LoadingComponent from "@/components/shared/LoadingComponent";
import toast from "react-hot-toast";

export default function GeneralTab() {
  const intl = useIntl();
  const { admin, loading, updateAdminCache, invalidateAdmin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);
  const restoreFileRef = useRef<HTMLInputElement | null>(null);

  // Database Management Functions
  async function handleBackupDatabase() {
    setBackupLoading(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.creating_backup" })
    );

    try {
      const response = await axios.get("/database/backup", {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "Bariqe_El_Tamioz_Backup.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "general.backup_created_success" })
      );
    } catch (error: any) {
      console.error("Backup error:", error);
      toast.dismiss(loadingToast);

      const errorMessage =
        error?.response?.data?.message ??
        error?.message ??
        intl.formatMessage({ id: "general.backup_failed" });
      toast.error(errorMessage);
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleDownloadTemplate() {
    setTemplateLoading(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.downloading_template" })
    );

    try {
      const response = await axios.get("/database/download-template", {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "Bariqe_El_Tamioz_Complete_Import_Template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "general.template_downloaded_success" })
      );
    } catch (error: any) {
      console.error("Template download error:", error);
      toast.dismiss(loadingToast);

      const errorMessage =
        error?.response?.data?.message ??
        error?.message ??
        intl.formatMessage({ id: "general.template_download_failed" });
      toast.error(errorMessage);
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleRestoreDatabase(file: File) {
    setRestoreLoading(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.restoring_database" })
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/database/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);

      if (response.data?.results) {
        const { summary } = response.data.results;
        toast.success(
          intl.formatMessage(
            { id: "general.restore_completed" },
            {
              processed: summary.totalProcessed || 0,
              errors: summary.totalErrors || 0,
            }
          )
        );
      } else {
        toast.success(intl.formatMessage({ id: "general.restore_success" }));
      }

      setShowRestoreDialog(false);
      setSelectedRestoreFile(null);
    } catch (error: any) {
      console.error("Restore error:", error);
      toast.dismiss(loadingToast);

      const errorMessage =
        error?.response?.data?.message ??
        error?.message ??
        intl.formatMessage({ id: "general.restore_failed" });
      toast.error(errorMessage);
    } finally {
      setRestoreLoading(false);
    }
  }

  function handleRestoreFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "xlsx" && ext !== "xls") {
        toast.error(intl.formatMessage({ id: "general.invalid_file_type" }));
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(intl.formatMessage({ id: "general.file_too_large" }));
        return;
      }

      setSelectedRestoreFile(file);
      toast.success(intl.formatMessage({ id: "general.file_selected_successfully" }));
    }

    // Reset input
    if (restoreFileRef.current) {
      restoreFileRef.current.value = "";
    }
  }

  function handleConfirmRestore() {
    if (selectedRestoreFile) {
      toast.error(
        intl.formatMessage({ id: "general.confirm_restore_warning" }),
        {
          duration: 3000,
        }
      );
      // Give user a moment to see the warning, then proceed
      setTimeout(() => {
        handleRestoreDatabase(selectedRestoreFile);
      }, 1000);
    }
  }

  // Cover Image States
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (admin) {
      setName(admin.firstName ?? "");
      setEmail(admin.email ?? "");
      setPreview(admin.profilePicture ?? admin.avatar ?? null);
      setCoverPreview(admin.coverImage ?? null);
    }
  }, [admin]);

  function onChooseFile() {
    inputRef.current?.click();
  }

  function onChooseCoverFile() {
    coverInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      // Validate file size (max 5MB)
      if (f.size > 5 * 1024 * 1024) {
        toast.error(intl.formatMessage({ id: "general.file_size_limit" }));
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  function onCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      // Validate file size (max 5MB)
      if (f.size > 5 * 1024 * 1024) {
        toast.error(intl.formatMessage({ id: "general.file_size_limit" }));
        return;
      }
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  }

  async function onSave() {
    // Validate inputs
    if (!name.trim()) {
      toast.error(intl.formatMessage({ id: "general.name_required" }));
      return;
    }

    if (!email.trim()) {
      toast.error(intl.formatMessage({ id: "general.email_required" }));
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    // Show loading toast
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.updating_profile" })
    );

    try {
      let res: any;
      if (file) {
        const fd = new FormData();
        fd.append("firstName", name);
        fd.append("email", email);
        fd.append("avatar", file);

        res = await axios.patch("/auth/me", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        });
      } else {
        res = await axios.patch("/auth/me", { firstName: name, email });
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "general.profile_updated_success" })
      );

      setFile(null);

      // Update the cache with new admin data
      if (res?.admin) {
        updateAdminCache(res.admin);
        setPreview(res.admin.avatar || res.admin.profilePicture);
      } else {
        // If no admin data in response, invalidate to refetch
        invalidateAdmin();
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.dismiss(loadingToast);

      const errorMessage =
        err?.response?.data?.message ??
        err?.message ??
        intl.formatMessage({ id: "general.failed_to_update_profile" });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  async function onSaveCover() {
    if (!coverFile) return;

    setCoverSaving(true);
    setCoverUploadProgress(0);

    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.uploading_cover_image" })
    );

    try {
      const fd = new FormData();
      fd.append("coverImage", coverFile);

      const res :any= await axios.post("/auth/cover-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setCoverUploadProgress(progress);
          }
        },
      });

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "general.cover_image_updated_success" })
      );

      setCoverFile(null);

      if (res?.newImageUrl && admin) {
        // Update admin cache with new cover image
        const updatedAdmin = { ...admin, coverImage: res.newImageUrl };
        updateAdminCache(updatedAdmin);
        setCoverPreview(res.newImageUrl);
      } else {
        invalidateAdmin(); // Refetch if no direct URL
      }
    } catch (err: any) {
      console.error("Error updating cover image:", err);
      toast.dismiss(loadingToast);

      const errorMessage =
        err?.response?.data?.message ??
        err?.message ??
        intl.formatMessage({ id: "general.failed_to_update_cover_image" });
      toast.error(errorMessage);
    } finally {
      setCoverSaving(false);
      setCoverUploadProgress(0);
    }
  }

  async function onRemoveCover() {
    setCoverSaving(true);

    const loadingToast = toast.loading(
      intl.formatMessage({ id: "general.removing_cover_image" })
    );

    try {
      await axios.delete("/auth/cover-image");

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "general.cover_image_removed_success" })
      );

      setCoverPreview(null);
      setCoverFile(null);

      // Update cache to remove cover image
      if (admin) {
        const updatedAdmin = { ...admin, coverImage: "" };
        updateAdminCache(updatedAdmin);
      }
    } catch (err: any) {
      console.error("Error removing cover image:", err);
      toast.dismiss(loadingToast);

      const errorMessage =
        err?.response?.data?.message ??
        err?.message ??
        intl.formatMessage({ id: "general.failed_to_remove_cover_image" });
      toast.error(errorMessage);
    } finally {
      setCoverSaving(false);
    }
  }

  function onRemoveImage() {
    setFile(null);
    setPreview(null);
    toast.success(
      intl.formatMessage({ id: "general.avatar_removed_from_preview" })
    );
  }

  function onRemoveCoverPreview() {
    setCoverFile(null);
    setCoverPreview(admin?.coverImage ?? null);
    toast.success(
      intl.formatMessage({ id: "general.cover_image_removed_from_preview" })
    );
  }

  if (loading) return <LoadingComponent />;

  return (
    <div className="space-y-6">
      {/* Cover Image Section */}
      <SectionCard title={intl.formatMessage({ id: "general.cover_image" })}>
        <div className="space-y-4">
          <div className="relative">
            <div className="w-full h-48 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="mx-auto h-12 w-12 mb-2" />
                  <p>{intl.formatMessage({ id: "general.no_cover_image" })}</p>
                </div>
              )}
            </div>

            {coverPreview && (
              <button
                onClick={onRemoveCoverPreview}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={coverSaving}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onChooseCoverFile}
              disabled={coverSaving}
            >
              {intl.formatMessage({ id: "general.choose_cover_image" })}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCoverFileChange}
            />

            {coverFile && (
              <Button
                onClick={onSaveCover}
                disabled={coverSaving}
                size="sm"
                className="bg-primary text-white hover:bg-primary/85"
              >
                {coverSaving
                  ? intl.formatMessage({ id: "general.uploading" })
                  : intl.formatMessage({ id: "general.upload_cover" })}
              </Button>
            )}

            {coverPreview && !coverFile && (
              <Button
                onClick={onRemoveCover}
                disabled={coverSaving}
                className="text-white"
                variant="destructive"
                size="sm"
              >
                {coverSaving
                  ? intl.formatMessage({ id: "general.removing" })
                  : intl.formatMessage({ id: "general.remove_cover" })}
              </Button>
            )}
          </div>

          {coverSaving && coverUploadProgress > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">
                {intl.formatMessage(
                  { id: "general.uploading_progress" },
                  { progress: coverUploadProgress }
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${coverUploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Admin Profile Section */}
      <SectionCard title={intl.formatMessage({ id: "general.admin_profile" })}>
        <div className="md:flex md:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
              {preview ? (
                <img
                  src={preview}
                  alt="admin"
                  className="w-24 h-24 object-cover"
                />
              ) : (
                <div className="text-gray-400">
                  {intl.formatMessage({ id: "general.no_image" })}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onChooseFile}
                disabled={saving}
                className="text-xs"
              >
                {intl.formatMessage({ id: "general.change" })}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              {preview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemoveImage}
                  disabled={saving}
                  className="text-xs"
                >
                  {intl.formatMessage({ id: "general.remove" })}
                </Button>
              )}
            </div>

            {saving && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  {intl.formatMessage(
                    { id: "general.uploading_progress" },
                    { progress: uploadProgress }
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 md:mt-0 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {intl.formatMessage({ id: "general.admin_name_required" })}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50 focus:border-primary focus:outline-none"
                  placeholder={intl.formatMessage({
                    id: "general.enter_admin_name",
                  })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {intl.formatMessage({ id: "general.admin_email_required" })}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50 focus:border-primary focus:outline-none"
                  placeholder={intl.formatMessage({
                    id: "general.enter_admin_email",
                  })}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={onSave}
                disabled={saving || !name.trim() || !email.trim()}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/85 disabled:opacity-50"
              >
                {saving
                  ? intl.formatMessage({ id: "general.saving" })
                  : intl.formatMessage({ id: "general.save_profile" })}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Database Management Section */}
      <SectionCard
        title={intl.formatMessage({ id: "general.database_management" })}
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {intl.formatMessage({ id: "general.important_notice" })}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {intl.formatMessage({
                      id: "general.backup_restore_warning",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              variant="default"
              className="bg-primary text-white hover:bg-primary/85"
              size="sm"
              onClick={handleBackupDatabase}
              disabled={backupLoading || templateLoading || restoreLoading}
            >
              <DatabaseBackup className="mr-2 h-4 w-4" />
              {backupLoading
                ? intl.formatMessage({ id: "general.creating_backup" })
                : intl.formatMessage({ id: "general.backup_database" })}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
              onClick={() => setShowRestoreDialog(true)}
              disabled={backupLoading || templateLoading || restoreLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {restoreLoading
                ? intl.formatMessage({ id: "general.restoring" })
                : intl.formatMessage({ id: "general.restore_database" })}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="restore-database-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {intl.formatMessage({ id: "general.restore_database" })}
            </DialogTitle>
            <DialogDescription id="restore-database-description">
              {intl.formatMessage({ id: "general.restore_instructions" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Download Template Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Button
                onClick={handleDownloadTemplate}
                disabled={templateLoading || restoreLoading || backupLoading}
                className="cursor-pointer text-white mb-3 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {templateLoading ? (
                  <>{intl.formatMessage({ id: "general.downloading_template" })}</>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2 text-white" />
                    {intl.formatMessage({ id: "general.download_import_template" })}
                  </>
                )}
              </Button>
              <h4 className="font-semibold text-blue-900 mb-2">
                {intl.formatMessage({ id: "general.instructions_title" })}
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ">
                <li>{intl.formatMessage({ id: "general.instruction_1" })}</li>
                <li>{intl.formatMessage({ id: "general.instruction_2" })}</li>
                <li>{intl.formatMessage({ id: "general.instruction_3" })}</li>
                <li>{intl.formatMessage({ id: "general.instruction_4" })}</li>
                <li>{intl.formatMessage({ id: "general.instruction_5" })}</li>
                <li>{intl.formatMessage({ id: "general.instruction_6" })}</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {intl.formatMessage({ id: "general.warning" })}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      {intl.formatMessage({
                        id: "general.restore_warning_message",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>{intl.formatMessage({ id: "general.select_backup_file" })}</Label>
              <Input
                ref={restoreFileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleRestoreFileSelect}
                disabled={restoreLoading}
                className="cursor-pointer"
              />
              {selectedRestoreFile && (
                <p className="text-sm text-gray-600">
                  {intl.formatMessage({ id: "general.selected_file" })}: {selectedRestoreFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {intl.formatMessage({ id: "general.accepted_formats" })}: .xlsx, .xls
              </p>
            </div>
          </div>

          <DialogFooter className="mt-1">
            <DialogClose asChild>
              <Button variant="outline" disabled={restoreLoading || templateLoading}>
                {intl.formatMessage({ id: "general.cancel" })}
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirmRestore}
              disabled={!selectedRestoreFile || restoreLoading || templateLoading || backupLoading}
              className="text-white bg-red-600 hover:bg-red-700"
            >
              {restoreLoading ? (
                <>{intl.formatMessage({ id: "general.restoring" })}</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "general.confirm_restore" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}