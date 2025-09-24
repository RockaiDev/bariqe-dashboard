import { useState, useRef } from "react";
import { useIntl } from 'react-intl';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SectionCard from "./SectionCard";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  X, 
  FileText, 
  Download, 
  UploadCloud,
  Calendar,
  Tag,
  FileImage,
  FilePlus2,
  Trash2
} from "lucide-react";

import toast from 'react-hot-toast';
import {
  useEvents,
  useExportEvents,
  useDownloadTemplate,
  useImportEvents,
} from '../../hooks/useEvents';
import EventsList from "./EventsList";

// Form validation schema - مخطط التحقق المحدث
const eventSchema = z.object({
  titleAr: z.string().min(1, 'Arabic title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  date: z.string().min(1, 'Date is required'),
  tags: z.string().optional(),
  contentAr: z.string().min(1, 'Arabic content is required'),
  contentEn: z.string().min(1, 'English content is required'),
  status: z.enum(['draft', 'published', 'archived']),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EventsLogsTab() {
  const intl = useIntl();
  const { admin } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { create } = useEvents();

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      titleAr: '',
      titleEn: '',
      date: '',
      tags: '',
      contentAr: '',
      contentEn: '',
      status: 'draft',
    },
  });

  // Special operations mutations
  const exportEventsMutation = useExportEvents();
  const downloadTemplateMutation = useDownloadTemplate();
  const importEventsMutation = useImportEvents();

  // Watch form values for validation
  const watchedValues = watch();
  const canSave = watchedValues.titleAr && watchedValues.titleEn && 
                  watchedValues.contentAr && watchedValues.contentEn && 
                  watchedValues.date;

  function onChooseFiles() {
    fileInputRef.current?.click();
  }

  function onChooseImportFile() {
    importInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(intl.formatMessage({ id: "events.file_too_large" }, { fileName: file.name }));
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(intl.formatMessage({ id: "events.files_selected" }, { count: validFiles.length }));
    }
  }

  function onImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext !== 'xlsx' && ext !== 'xls') {
        toast.error(intl.formatMessage({ id: "events.invalid_excel_file" }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(intl.formatMessage({ id: "events.file_size_limit" }));
        return;
      }
      
      setImportFile(file);
      toast.success(intl.formatMessage({ id: "events.import_file_selected" }));
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    toast.success(intl.formatMessage({ id: "events.file_removed" }));
  };

  const removeImportFile = () => {
    setImportFile(null);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
    toast.success(intl.formatMessage({ id: "events.import_file_removed" }));
  };

  const resetForm = () => {
    reset({
      titleAr: '',
      titleEn: '',
      date: '',
      tags: '',
      contentAr: '',
      contentEn: '',
      status: 'draft',
    });
    setSelectedFiles([]);
    toast.success(intl.formatMessage({ id: "events.form_reset" }));
  };

  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    const loadingToast = toast.loading(intl.formatMessage({ id: "events.creating_event" }));
    setUploadProgress(0);

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      selectedFiles.forEach((file) => {
        formData.append('eventFiles', file);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await create.mutateAsync(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "events.event_created_success" }));
      
      reset({
        titleAr: '',
        titleEn: '',
        date: '',
        tags: '',
        contentAr: '',
        contentEn: '',
        status: 'draft',
      });
      setSelectedFiles([]);
      setUploadProgress(0);
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || intl.formatMessage({ id: "events.failed_to_create_event" });
      toast.error(errorMessage);
      setUploadProgress(0);
    }
  };

  const handleExport = () => {
    exportEventsMutation.mutate();
  };

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    const loadingToast = toast.loading(intl.formatMessage({ id: "events.importing_events" }));
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 15;
        });
      }, 300);

      await importEventsMutation.mutateAsync(importFile);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      toast.dismiss(loadingToast);
      
      setImportFile(null);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
      setImportProgress(0);
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || intl.formatMessage({ id: "events.failed_to_import_events" });
      toast.error(errorMessage);
      setImportProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-4 w-4 text-green-600" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4 text-red-600" />;
    return <FilePlus2 className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Import/Export Section */}
      <SectionCard title={intl.formatMessage({ id: "events.import_export_events" })}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {intl.formatMessage({ id: "events.import_events" })}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                {importFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600 truncate">
                        {importFile.name}
                      </span>
                    </div>
                    <button
                      onClick={removeImportFile}
                      className="text-red-500 hover:text-red-700"
                      disabled={importEventsMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "events.select_excel_file" })}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onChooseImportFile}
                  disabled={importEventsMutation.isPending}
                >
                  {intl.formatMessage({ id: "events.choose_file" })}
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onImportFileChange}
                />
                
                {importFile && (
                  <Button
                    onClick={handleImport}
                    disabled={importEventsMutation.isPending}
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {importEventsMutation.isPending ? intl.formatMessage({ id: "events.importing" }) : intl.formatMessage({ id: "events.import" })}
                  </Button>
                )}
              </div>

              {importEventsMutation.isPending && importProgress > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {intl.formatMessage({ id: "events.importing_progress" }, { progress: importProgress })}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {intl.formatMessage({ id: "events.download_template" })}
              </label>
              <div className="text-center">
                <Download className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  {intl.formatMessage({ id: "events.get_import_template" })}
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplateMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {downloadTemplateMutation.isPending ? intl.formatMessage({ id: "events.downloading" }) : intl.formatMessage({ id: "events.download_template" })}
                </Button>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {intl.formatMessage({ id: "events.export_events" })}
              </label>
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  {intl.formatMessage({ id: "events.export_all_to_excel" })}
                </p>
                <Button
                  onClick={handleExport}
                  disabled={exportEventsMutation.isPending}
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/85"
                >
                  {exportEventsMutation.isPending ? intl.formatMessage({ id: "events.exporting" }) : intl.formatMessage({ id: "events.export_excel" })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Event Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title={intl.formatMessage({ id: "events.create_new_event" })}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* العنوان بالعربية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 ml-1" />
                  {intl.formatMessage({ id: "events.event_title_ar_required" })}
                </label>
                <input
                  {...register('titleAr')}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.titleAr ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={intl.formatMessage({ id: "events.enter_event_title_ar" })}
                  disabled={create.isPending}
                  dir="rtl"
                />
                {errors.titleAr && (
                  <p className="text-red-500 text-xs mt-1">{errors.titleAr.message}</p>
                )}
              </div>

              {/* العنوان بالإنجليزية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 ml-1" />
                  {intl.formatMessage({ id: "events.event_title_en_required" })}
                </label>
                <input
                  {...register('titleEn')}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.titleEn ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={intl.formatMessage({ id: "events.enter_event_title_en" })}
                  disabled={create.isPending}
                  dir="ltr"
                />
                {errors.titleEn && (
                  <p className="text-red-500 text-xs mt-1">{errors.titleEn.message}</p>
                )}
              </div>

              {/* التاريخ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: "events.event_date_required" })}
                </label>
                <input
                  {...register('date')}
                  type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={create.isPending}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                )}
              </div>

              {/* العلامات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="inline h-4 w-4 ml-1" />
                  {intl.formatMessage({ id: "events.tags" })}
                </label>
                <input
                  {...register('tags')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={intl.formatMessage({ id: "events.tags_placeholder" })}
                  disabled={create.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {intl.formatMessage({ id: "events.separate_tags_with_commas" })}
                </p>
              </div>

              {/* الحالة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: "events.status" })}
                </label>
                <select
                  {...register('status')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  disabled={create.isPending}
                >
                  <option value="draft">{intl.formatMessage({ id: "events.draft" })}</option>
                  <option value="published">{intl.formatMessage({ id: "events.published" })}</option>
                  <option value="archived">{intl.formatMessage({ id: "events.archived" })}</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* المحتوى بالعربية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: "events.event_content_ar_required" })}
                </label>
                <textarea
                  {...register('contentAr')}
                  rows={6}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
                    errors.contentAr ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={intl.formatMessage({ id: "events.enter_event_description_ar" })}
                  disabled={create.isPending}
                  dir="rtl"
                />
                {errors.contentAr && (
                  <p className="text-red-500 text-xs mt-1">{errors.contentAr.message}</p>
                )}
              </div>

              {/* المحتوى بالإنجليزية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: "events.event_content_en_required" })}
                </label>
                <textarea
                  {...register('contentEn')}
                  rows={6}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
                    errors.contentEn ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={intl.formatMessage({ id: "events.enter_event_description_en" })}
                  disabled={create.isPending}
                  dir="ltr"
                />
                {errors.contentEn && (
                  <p className="text-red-500 text-xs mt-1">{errors.contentEn.message}</p>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {intl.formatMessage({ id: "events.attach_files" })}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  {intl.formatMessage({ id: "events.select_files_to_upload" })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onChooseFiles}
                  disabled={create.isPending}
                >
                  {intl.formatMessage({ id: "events.choose_files" })}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {intl.formatMessage({ id: "events.selected_files" }, { count: selectedFiles.length })}:
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {getFileIcon(file)}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={create.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {create.isPending && uploadProgress > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                  <span>{intl.formatMessage({ id: "events.creating_event" })}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={create.isPending}
              >
                {intl.formatMessage({ id: "events.reset_form" })}
              </Button>
              
              <Button
                type="submit"
                disabled={create.isPending || !canSave}
                className="bg-primary text-white hover:bg-primary/85 disabled:opacity-50"
              >
                {create.isPending ? intl.formatMessage({ id: "events.creating" }) : intl.formatMessage({ id: "events.create_event" })}
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>

      {/* Current Admin Info */}
      <SectionCard title={intl.formatMessage({ id: "events.event_author_information" })}>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {intl.formatMessage({ id: "events.events_will_be_created_by" }, { name: admin?.firstName || intl.formatMessage({ id: "events.admin" }) })}
            </p>
            <p className="text-xs text-gray-500">
              {intl.formatMessage({ id: "events.author_email" }, { email: admin?.email })}
            </p>
          </div>
        </div>
      </SectionCard>
      
      <EventsList />
    </div>
  );
}