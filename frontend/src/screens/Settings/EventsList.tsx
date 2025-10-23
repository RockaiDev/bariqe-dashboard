// EventsList.tsx - محدث بتصميم محسّن لجميع الشاشات
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SectionCard from './SectionCard';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { Button } from "@/components/ui/button";
import LoadingComponent from "@/components/shared/LoadingComponent";
import toast from 'react-hot-toast';
import {
  useEvents,
  useEvent,
  useRemoveEventFile,
  type Event,
  type EventFile,
} from '../../hooks/useEvents';
import {
  Calendar,
  Tag,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  FileImage,
  FilePlus2,
  ImagePlus,
  User,
  Clock,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Edit3,
  Save,
  X,
  Upload,
  Camera,
  ZoomIn,
  File,
  ExternalLink,
} from 'lucide-react';

// Form validation schema
const editEventSchema = z.object({
  titleAr: z.string().min(1, 'Arabic title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  date: z.string().min(1, 'Date is required'),
  tagsAr: z.string().optional(),
  tagsEn: z.string().optional(),
  contentAr: z.string().min(1, 'Arabic content is required'),
  contentEn: z.string().min(1, 'English content is required'),
  status: z.enum(['draft', 'published', 'archived']),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

// Image Preview Dialog Component - محسّن للموبايل
const ImagePreviewDialog = ({ 
  open, 
  onClose, 
  imageUrl, 
  title 
}: { 
  open: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  title: string;
}) => {
  const intl = useIntl();
  
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl max-h-[95vh] w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-t-lg p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              onClick={() => window.open(imageUrl, '_blank')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{intl.formatMessage({ id: "events.open_in_new_tab" })}</span>
              <span className="sm:hidden">Open</span>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{intl.formatMessage({ id: "events.close" })}</span>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-900 rounded-b-lg overflow-auto flex items-center justify-center p-2 sm:p-4">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-full object-contain rounded"
            style={{ maxHeight: 'calc(95vh - 60px)' }}
          />
        </div>
        
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
          {intl.formatMessage({ id: "events.click_outside_to_close" })}
        </div>
      </div>
    </div>
  );
};

// File Actions Component
const FileActions = ({ 
  file, 
}: { 
  file: EventFile; 
  eventId: string; 
  onRemove: (eventId: string, fileId: string, fileName: string) => void;
}) => {
  const intl = useIntl();

  const handlePreview = () => {
    if (file.path) {
      window.open(file.path, '_blank');
      toast.success(intl.formatMessage({ id: "events.opening_file" }));
    } else {
      toast.error(intl.formatMessage({ id: "events.failed_to_open_file" }));
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        onClick={handlePreview}
        variant="outline"
        size="sm"
        className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0 p-1.5 sm:p-2"
        title={intl.formatMessage({ id: "events.preview_file" })}
      >
        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};

export default function EventsList() {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  const [imagePreviewDialog, setImagePreviewDialog] = useState<{
    open: boolean;
    imageUrl: string;
    title: string;
  }>({
    open: false,
    imageUrl: '',
    title: '',
  });
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    open: false,
    eventId: null,
    eventTitle: '',
  });
  
  const [fileDeleteDialog, setFileDeleteDialog] = useState<{
    open: boolean;
    eventId: string | null;
    fileId: string | null;
    fileName: string;
  }>({
    open: false,
    eventId: null,
    fileId: null,
    fileName: '',
  });

  // Build queries
  const queries = [];
  if (searchTerm) {
    queries.push(['$or', [
      ['titleAr', 'regex', searchTerm],
      ['titleEn', 'regex', searchTerm]
    ]]);
  }
  if (statusFilter !== 'all') {
    queries.push(['status', '==', statusFilter]);
  }

  const { list, del, update } = useEvents({
    page: currentPage,
    perPage: 10,
    queries: queries.length > 0 ? queries : undefined,
  });

  const { data: selectedEvent, isLoading: eventLoading } = useEvent(selectedEventId || '');
  const removeFileMutation = useRemoveEventFile();

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
  });

  // Dialog handlers
  const openDeleteDialog = (id: string, title: string) => {
    setDeleteDialog({
      open: true,
      eventId: id,
      eventTitle: title,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      eventId: null,
      eventTitle: '',
    });
  };

  const openFileDeleteDialog = (eventId: string, fileId: string, fileName: string) => {
    setFileDeleteDialog({
      open: true,
      eventId,
      fileId,
      fileName,
    });
  };

  const closeFileDeleteDialog = () => {
    setFileDeleteDialog({
      open: false,
      eventId: null,
      fileId: null,
      fileName: '',
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.eventId) return;
    
    try {
      await del.mutateAsync(deleteDialog.eventId);
      toast.success(intl.formatMessage({ id: "events.event_deleted_success" }));
      closeDeleteDialog();
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || error.message || intl.formatMessage({ id: "events.failed_to_delete_event" });
      toast.error(errorMessage);
    }
  };

  const handleRemoveFile = async () => {
    if (!fileDeleteDialog.eventId || !fileDeleteDialog.fileId) return;
    
    try {
      await removeFileMutation.mutateAsync({ 
        eventId: fileDeleteDialog.eventId, 
        fileId: fileDeleteDialog.fileId 
      });
      toast.success(intl.formatMessage({ id: "events.file_removed_success" }));
      closeFileDeleteDialog();
    } catch (error: any) {
      console.error('Remove file error:', error);
      const errorMessage = error.response?.data?.message || error.message || intl.formatMessage({ id: "events.failed_to_remove_file" });
      toast.error(errorMessage);
    }
  };

  const toggleEventView = (eventId: string) => {
    setSelectedEventId(selectedEventId === eventId ? null : eventId);
  };

  const startEdit = (event: Event) => {
    setEditingEventId(event._id!);
    setValue('titleAr', event.titleAr);
    setValue('titleEn', event.titleEn);
    setValue('date', event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '');
    setValue('tagsAr', event.tagsAr?.join(', ') || '');
    setValue('tagsEn', event.tagsEn?.join(', ') || '');
    setValue('contentAr', event.contentAr);
    setValue('contentEn', event.contentEn);
    setValue('status', event.status);
    setSelectedFiles([]);
    setEditingImageUrl(event.eventImage || null);
    setOriginalImageUrl(event.eventImage || null);
    setRemoveExistingImage(false);
    setSelectedImageFile(null);
    toast.success(intl.formatMessage({ id: "events.editing_mode_enabled" }));
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    reset();
    setSelectedFiles([]);
    setEditingImageUrl(null);
    setOriginalImageUrl(null);
    setRemoveExistingImage(false);
    setSelectedImageFile(null);
    toast.success(intl.formatMessage({ id: "events.edit_cancelled" }));
  };

  const onSubmitEdit = async (data: EditEventFormData) => {
    if (!editingEventId) return;

    const loadingToast = toast.loading(intl.formatMessage({ id: "events.updating_event" }));

    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key as keyof EditEventFormData];
        if (value !== undefined) {
          formData.append(key, value);
        }
      });

      if (removeExistingImage && originalImageUrl) {
        formData.append('removeImage', '1');
      }

      if (selectedImageFile) {
        formData.append('eventImage', selectedImageFile);
      }

      selectedFiles.forEach((file) => {
        formData.append('eventFiles', file);
      });

      await update.mutateAsync({ id: editingEventId, payload: formData });
      
      toast.dismiss(loadingToast);
      toast.success(intl.formatMessage({ id: "events.event_updated_success" }));
      
      setEditingEventId(null);
      reset();
      setSelectedFiles([]);
      setEditingImageUrl(null);
      setOriginalImageUrl(null);
      setRemoveExistingImage(false);
      setSelectedImageFile(null);
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || intl.formatMessage({ id: "events.failed_to_update_event" });
      toast.error(errorMessage);
    }
  };

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(intl.formatMessage({ id: "events.please_select_image_file" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(intl.formatMessage({ id: "events.image_too_large" }));
      return;
    }

    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setEditingImageUrl(url);
    setRemoveExistingImage(false);
    toast.success(intl.formatMessage({ id: "events.image_selected" }));
  };

  const openImagePreview = (imageUrl: string, title: string) => {
    setImagePreviewDialog({
      open: true,
      imageUrl,
      title,
    });
  };

  const closeImagePreview = () => {
    setImagePreviewDialog({
      open: false,
      imageUrl: '',
      title: '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    toast.success(intl.formatMessage({ id: "events.file_removed" }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <FileImage className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
    if (mimetype === 'application/pdf') return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
    if (mimetype.includes('word') || mimetype.includes('document')) return <File className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
    return <FilePlus2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />;
  };

  const getEventTitle = (event: Event) => {
    return intl.locale === 'ar' ? event.titleAr : event.titleEn;
  };

  const getEventContent = (event: Event) => {
    return intl.locale === 'ar' ? event.contentAr : event.contentEn;
  };

  const getEventTags = (event: Event) => {
    return intl.locale === 'ar' ? event.tagsAr : event.tagsEn;
  };

  if (list.isLoading) {
    return <LoadingComponent />;
  }

  if (list.isError) {
    console.error('List error:', list.error);
    return (
      <SectionCard title={intl.formatMessage({ id: "events.events" })}>
        <div className="text-center py-8 sm:py-12">
          <AlertCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{intl.formatMessage({ id: "events.failed_to_load_events" })}</h3>
          <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">
            {list.error?.message || intl.formatMessage({ id: "events.error_occurred_loading_events" })}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => list.refetch()}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              {intl.formatMessage({ id: "events.try_again" })}
            </Button>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
                setTimeout(() => list.refetch(), 100);
              }}
              variant="outline"
              size="sm"
            >
              {intl.formatMessage({ id: "events.reset_and_retry" })}
            </Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  const eventsData = list.data;
  const events: Event[] = eventsData?.data || [];
  const totalPages = eventsData?.totalPages || 1;
  const totalItems = eventsData?.totalItems || 0;

  return (
    <>
      <SectionCard title={intl.formatMessage({ id: "events.events_management" }, { count: totalItems })}>
        {/* Search and Filters - محسّن للموبايل */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 w-full">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder={intl.formatMessage({ id: "events.search_events_by_title" })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 sm:pr-10 pl-3 sm:pl-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Filter className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pr-8 sm:pr-10 pl-3 sm:pl-8 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white w-full"
                >
                  <option value="all">{intl.formatMessage({ id: "events.all_status" })}</option>
                  <option value="draft">{intl.formatMessage({ id: "events.draft" })}</option>
                  <option value="published">{intl.formatMessage({ id: "events.published" })}</option>
                  <option value="archived">{intl.formatMessage({ id: "events.archived" })}</option>
                </select>
              </div>
              
              <Button
                onClick={() => list.refetch()}
                variant="outline"
                size="sm"
                disabled={list.isLoading}
                className="p-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${list.isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3 sm:space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">{intl.formatMessage({ id: "events.no_events_found" })}</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? intl.formatMessage({ id: "events.try_adjusting_search" })
                  : intl.formatMessage({ id: "events.create_first_event" })}
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-3 sm:mt-4"
                >
                  {intl.formatMessage({ id: "events.clear_filters" })}
                </Button>
              )}
            </div>
          ) : (
            events.map((event: Event) => (
              <div
                key={event._id}
                className={`border rounded-lg bg-white transition-all duration-200 ${
                  editingEventId === event._id
                    ? 'border-primary shadow-lg ring-2 ring-primary/10'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Event Header */}
                <div className="p-3 sm:p-4 lg:p-6">
                  {editingEventId === event._id ? (
                    /* Edit Form - محسّن للموبايل */
                    <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {/* العنوان بالعربية */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.event_title_ar_required" })}
                          </label>
                          <input
                            {...register('titleAr')}
                            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                              errors.titleAr ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={intl.formatMessage({ id: "events.enter_event_title_ar" })}
                            dir="rtl"
                          />
                          {errors.titleAr && (
                            <p className="text-red-500 text-xs mt-1">{errors.titleAr.message}</p>
                          )}
                        </div>

                        {/* العنوان بالإنجليزية */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.event_title_en_required" })}
                          </label>
                          <input
                            {...register('titleEn')}
                            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                              errors.titleEn ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={intl.formatMessage({ id: "events.enter_event_title_en" })}
                            dir="ltr"
                          />
                          {errors.titleEn && (
                            <p className="text-red-500 text-xs mt-1">{errors.titleEn.message}</p>
                          )}
                        </div>

                        {/* التاريخ */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.event_date_required" })}
                          </label>
                          <input
                            {...register('date')}
                            type="date"
                            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                              errors.date ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.date && (
                            <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                          )}
                        </div>

                        {/* الحالة */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.status" })}
                          </label>
                          <select
                            {...register('status')}
                            className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="draft">{intl.formatMessage({ id: "events.draft" })}</option>
                            <option value="published">{intl.formatMessage({ id: "events.published" })}</option>
                            <option value="archived">{intl.formatMessage({ id: "events.archived" })}</option>
                          </select>
                        </div>

                        {/* العلامات بالعربية */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            <Tag className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                            {intl.formatMessage({ id: "events.tags_ar" })}
                          </label>
                          <input
                            {...register('tagsAr')}
                            className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder={intl.formatMessage({ id: "events.tags_ar_placeholder" })}
                            dir="rtl"
                          />
                        </div>

                        {/* العلامات بالإنجليزية */}
                        <div className="col-span-1 md:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            <Tag className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                            {intl.formatMessage({ id: "events.tags_en" })}
                          </label>
                          <input
                            {...register('tagsEn')}
                            className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder={intl.formatMessage({ id: "events.tags_en_placeholder" })}
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* المحتوى */}
                      <div className="space-y-3 sm:space-y-4">
                        {/* المحتوى بالعربية */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.event_content_ar_required" })}
                          </label>
                          <textarea
                            {...register('contentAr')}
                            rows={3}
                            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
                              errors.contentAr ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={intl.formatMessage({ id: "events.enter_event_content_ar" })}
                            dir="rtl"
                          />
                          {errors.contentAr && (
                            <p className="text-red-500 text-xs mt-1">{errors.contentAr.message}</p>
                          )}
                        </div>

                        {/* المحتوى بالإنجليزية */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {intl.formatMessage({ id: "events.event_content_en_required" })}
                          </label>
                          <textarea
                            {...register('contentEn')}
                            rows={3}
                            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
                              errors.contentEn ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={intl.formatMessage({ id: "events.enter_event_content_en" })}
                            dir="ltr"
                          />
                          {errors.contentEn && (
                            <p className="text-red-500 text-xs mt-1">{errors.contentEn.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Image Edit Section - محسّن للموبايل */}
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          <ImagePlus className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                          {intl.formatMessage({ id: "events.event_image" })}
                        </label>
                        
                        {editingImageUrl && !removeExistingImage ? (
                          <div className="mb-3 sm:mb-4">
                            <div className="relative inline-block group">
                              <img 
                                src={editingImageUrl} 
                                alt="Preview" 
                                className="w-full max-w-[200px] sm:max-w-md h-32 sm:h-48 object-cover rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => openImagePreview(editingImageUrl, intl.formatMessage({ id: "events.image_preview" }))}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg">
                                <ZoomIn className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedImageFile) {
                                    setSelectedImageFile(null);
                                    setEditingImageUrl(originalImageUrl);
                                  } else {
                                    setRemoveExistingImage(true);
                                    setEditingImageUrl(null);
                                  }
                                }}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 sm:p-2 hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center mb-3 sm:mb-4 bg-white">
                            <Camera className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-2 sm:mb-3" />
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                              {removeExistingImage 
                                ? intl.formatMessage({ id: "events.image_will_be_removed" })
                                : intl.formatMessage({ id: "events.no_image_selected" })
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              {intl.formatMessage({ id: "events.select_image_below" })}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <label className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer transition-colors text-xs sm:text-sm font-medium">
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                            {intl.formatMessage({ id: "events.choose_image" })}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageChange} 
                              className="hidden"
                            />
                          </label>
                          
                          {originalImageUrl && !removeExistingImage && !selectedImageFile && (
                            <button 
                              type="button" 
                              onClick={() => { 
                                setRemoveExistingImage(true); 
                                setEditingImageUrl(null); 
                                setSelectedImageFile(null); 
                              }} 
                              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                            >
                              {intl.formatMessage({ id: "events.remove_image" })}
                            </button>
                          )}
                          
                          {removeExistingImage && (
                            <button 
                              type="button" 
                              onClick={() => { 
                                setRemoveExistingImage(false); 
                                setEditingImageUrl(originalImageUrl); 
                              }} 
                              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                            >
                              {intl.formatMessage({ id: "events.restore_image" })}
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                          {intl.formatMessage({ id: "events.image_requirements" })}
                        </p>
                      </div>

                      {/* Add New Files - محسّن للموبايل */}
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          <FilePlus2 className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                          {intl.formatMessage({ id: "events.add_new_files" })}
                        </label>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center bg-white">
                          <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                            {intl.formatMessage({ id: "events.upload_files" })}
                          </p>
                          <p className="text-xs text-gray-500 mb-2 sm:mb-3">
                            {intl.formatMessage({ id: "events.supported_formats" })}
                          </p>
                          <label className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer transition-colors text-xs sm:text-sm font-medium">
                            <FilePlus2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            {intl.formatMessage({ id: "events.choose_files" })}
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Selected New Files */}
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 sm:mt-4 space-y-2">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">
                              {intl.formatMessage({ id: "events.selected_files" }, { count: selectedFiles.length })}
                            </p>
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200"
                              >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <File className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeNewFile(index)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded transition-colors"
                                >
                                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Form Actions - محسّن للموبايل */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={update.isPending}
                          className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-xs sm:text-sm"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          {intl.formatMessage({ id: "events.cancel" })}
                        </Button>
                        
                        <Button
                          type="submit"
                          disabled={update.isPending}
                          className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto min-w-0 sm:min-w-[120px] text-xs sm:text-sm"
                        >
                          <Save className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          {update.isPending ? intl.formatMessage({ id: "events.saving" }) : intl.formatMessage({ id: "events.save_changes" })}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Display Mode - محسّن للموبايل */
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h4 className="text-sm sm:text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                            {getEventTitle(event)}
                          </h4>
                          <span
                            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              event.status
                            )}`}
                          >
                            {intl.formatMessage({ id: `events.${event.status}` })}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              {event.date ? format(new Date(event.date), 'PPP', { locale: ar }) : intl.formatMessage({ id: "events.no_date" })}
                            </span>
                          </div>
                          {event.createdAt && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{format(new Date(event.createdAt), 'PPp', { locale: ar })}</span>
                              <span className="sm:hidden">{format(new Date(event.createdAt), 'PP', { locale: ar })}</span>
                            </div>
                          )}
                          {event.author && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <User className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{event.author}</span>
                            </div>
                          )}
                        </div>

                        {/* Event Image Preview - محسّن للموبايل */}
                        {event.eventImage && (
                          <div className="mb-3 sm:mb-4">
                            <div className="relative inline-block group">
                              <img 
                                src={event.eventImage} 
                                alt={getEventTitle(event)}
                                className="w-32 h-20 sm:w-56 sm:h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105 transform duration-200"
                                onClick={() => openImagePreview(event.eventImage!, getEventTitle(event))}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                                <div className="text-center text-white">
                                  <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-0.5 sm:mb-1" />
                                  <p className="text-xs hidden sm:block">{intl.formatMessage({ id: "events.click_to_enlarge" })}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tags - محسّن للموبايل */}
                        {((event.tagsAr && event.tagsAr.length > 0) || (event.tagsEn && event.tagsEn.length > 0)) && (
                          <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                            <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {(getEventTags(event) || []).slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-50 text-blue-700 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                              {(getEventTags(event) || []).length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{(getEventTags(event) || []).length - 3} {intl.formatMessage({ id: "events.more" })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content Preview */}
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">
                          {getEventContent(event)}
                        </p>

                        {/* Meta Info - محسّن للموبايل */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                          {event.eventImage && (
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <ImagePlus className="h-3 w-3" />
                              {intl.formatMessage({ id: "events.has_image" })}
                            </span>
                          )}
                          {event.files && event.files.length > 0 && (
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <FileText className="h-3 w-3" />
                              {intl.formatMessage({ id: "events.files_count" }, { count: event.files.length })}
                            </span>
                          )}
                          {event.updatedAt && (
                            <span className="hidden sm:inline">
                              {intl.formatMessage({ id: "events.updated" })}: {format(new Date(event.updatedAt), 'PP', { locale: ar })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions - محسّن للموبايل */}
                      <div className="flex items-center gap-2 flex-wrap border-t pt-3 sm:border-t-0 sm:pt-0">
                        <Button
                          onClick={() => startEdit(event)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 sm:gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                          disabled={editingEventId !== null}
                        >
                          <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{intl.formatMessage({ id: "events.edit" })}</span>
                        </Button>

                        <Button
                          onClick={() => toggleEventView(event._id!)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                        >
                          {selectedEventId === event._id ? (
                            <>
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{intl.formatMessage({ id: "events.hide" })}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{intl.formatMessage({ id: "events.view" })}</span>
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => openDeleteDialog(event._id!, getEventTitle(event))}
                          disabled={del.isPending}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-2 sm:px-3 py-1 sm:py-1.5"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details - محسّن للموبايل */}
                {selectedEventId === event._id && editingEventId !== event._id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {eventLoading ? (
                      <div className="p-4 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">{intl.formatMessage({ id: "events.loading_details" })}</p>
                      </div>
                    ) : selectedEvent ? (
                      <div className="p-3 sm:p-4 lg:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          {/* Content */}
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                              {intl.formatMessage({ id: "events.full_content" })}
                            </h5>
                            
                            {/* عرض المحتوى بالعربية */}
                            <div className="mb-3 sm:mb-4">
                              <h6 className="font-medium text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm">{intl.formatMessage({ id: "events.arabic_content" })}</h6>
                              <div className="bg-white p-2 sm:p-4 rounded-lg border text-xs sm:text-sm text-gray-700 whitespace-pre-wrap max-h-32 sm:max-h-48 overflow-y-auto shadow-sm" dir="rtl">
                                {selectedEvent.contentAr}
                              </div>
                            </div>
                            
                            {/* عرض المحتوى بالإنجليزية */}
                            <div>
                              <h6 className="font-medium text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm">{intl.formatMessage({ id: "events.english_content" })}</h6>
                              <div className="bg-white p-2 sm:p-4 rounded-lg border text-xs sm:text-sm text-gray-700 whitespace-pre-wrap max-h-32 sm:max-h-48 overflow-y-auto shadow-sm" dir="ltr">
                                {selectedEvent.contentEn}
                              </div>
                            </div>

                            {/* عرض Tags */}
                            {((selectedEvent.tagsAr && selectedEvent.tagsAr.length > 0) || 
                              (selectedEvent.tagsEn && selectedEvent.tagsEn.length > 0)) && (
                              <div className="mt-3 sm:mt-4">
                                <h6 className="font-medium text-gray-700 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {intl.formatMessage({ id: "events.tags" })}
                                </h6>
                                
                                {selectedEvent.tagsAr && selectedEvent.tagsAr.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 mb-1">{intl.formatMessage({ id: "events.tags_ar" })}:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedEvent.tagsAr.map((tag, index) => (
                                        <span
                                          key={`ar-${index}`}
                                          className="bg-purple-50 text-purple-700 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-purple-200"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedEvent.tagsEn && selectedEvent.tagsEn.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">{intl.formatMessage({ id: "events.tags_en" })}:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedEvent.tagsEn.map((tag, index) => (
                                        <span
                                          key={`en-${index}`}
                                          className="bg-blue-50 text-blue-700 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-blue-200"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Files */}
                          <div>
                            {selectedEvent.files && selectedEvent.files.length > 0 ? (
                              <>
                                <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                                  <FilePlus2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {intl.formatMessage({ id: "events.attached_files" }, { count: selectedEvent.files.length })}
                                </h5>
                                <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                                  {selectedEvent.files.map((file) => (
                                    <div
                                      key={file._id}
                                      className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-lg border hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                      <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse flex-1 min-w-0">
                                        {getFileIcon(file.mimetype)}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {file.originalName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                          {file.cloudinaryPublicId && (
                                            <p className="text-xs text-green-600">
                                              {intl.formatMessage({ id: "events.stored_in_cloud" })}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <FileActions 
                                        file={file} 
                                        eventId={selectedEvent._id!} 
                                        onRemove={openFileDeleteDialog}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-6 sm:py-8 text-gray-500 bg-white rounded-lg border">
                                <FilePlus2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2 text-gray-400" />
                                <p className="text-xs sm:text-sm">{intl.formatMessage({ id: "events.no_files_attached" })}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Image Section - محسّن للموبايل */}
                        <div className="mt-4 sm:mt-6">
                          {selectedEvent.eventImage ? (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                                <ImagePlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                {intl.formatMessage({ id: "events.event_image" })}
                              </h5>
                              <div className="relative inline-block group">
                                <img
                                  src={selectedEvent.eventImage}
                                  alt={getEventTitle(selectedEvent)}
                                  className="w-full max-w-xs sm:max-w-2xl h-auto rounded-lg border-2 border-gray-200 shadow-md cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] transform duration-200"
                                  onClick={() => openImagePreview(selectedEvent.eventImage!, getEventTitle(selectedEvent))}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                                  <div className="text-center text-white">
                                    <ZoomIn className="h-6 w-6 sm:h-10 sm:w-10 mx-auto mb-1 sm:mb-2" />
                                    <p className="text-xs sm:text-sm font-medium">{intl.formatMessage({ id: "events.click_to_view_full" })}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8 text-gray-500 bg-white rounded-lg border">
                              <ImagePlus className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2 text-gray-400" />
                              <p className="text-xs sm:text-sm">{intl.formatMessage({ id: "events.no_image_attached" })}</p>
                            </div>
                          )}
                        </div>

                        {/* Metadata - محسّن للموبايل */}
                        {selectedEvent.createdAt && (
                          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs text-gray-500">
                              <div>
                                <span className="font-medium">{intl.formatMessage({ id: "events.created" })}:</span>{' '}
                                <span className="hidden sm:inline">{format(new Date(selectedEvent.createdAt), 'PPpp', { locale: ar })}</span>
                                <span className="sm:hidden">{format(new Date(selectedEvent.createdAt), 'PP', { locale: ar })}</span>
                              </div>
                              {selectedEvent.updatedAt && selectedEvent.updatedAt !== selectedEvent.createdAt && (
                                <div>
                                  <span className="font-medium">{intl.formatMessage({ id: "events.updated" })}:</span>{' '}
                                  <span className="hidden sm:inline">{format(new Date(selectedEvent.updatedAt), 'PPpp', { locale: ar })}</span>
                                  <span className="sm:hidden">{format(new Date(selectedEvent.updatedAt), 'PP', { locale: ar })}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">{intl.formatMessage({ id: "events.status" })}:</span>{' '}
                                <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs ${getStatusColor(selectedEvent.status)}`}>
                                  {intl.formatMessage({ id: `events.${selectedEvent.status}` })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 sm:p-6 text-center text-red-600">
                        <AlertCircle className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                        <p className="text-xs sm:text-sm">{intl.formatMessage({ id: "events.failed_to_load_event_details" })}</p>
                        <Button 
                          onClick={() => setSelectedEventId(null)} 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-xs sm:text-sm"
                        >
                          {intl.formatMessage({ id: "events.close" })}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination - محسّن للموبايل */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 sm:mt-8 space-x-2 sm:space-x-4 space-x-reverse">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || list.isLoading}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
            >
              {intl.formatMessage({ id: "events.previous" })}
            </Button>
            
            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage <= 2) {
                  pageNum = i + 1;
                } else if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 ${currentPage === pageNum ? "bg-primary text-white" : ""}`}
                    disabled={list.isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || list.isLoading}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
            >
              {intl.formatMessage({ id: "events.next" })}
            </Button>
          </div>
        )}

        {/* Page Info - محسّن للموبايل */}
        <div className="text-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
          {intl.formatMessage({ id: "events.showing_page" }, { 
            currentPage, 
            totalPages, 
            totalItems 
          })}
        </div>
      </SectionCard>

      {/* Delete Event Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
        title={intl.formatMessage({ id: "events.delete_event" })}
        message={intl.formatMessage({ id: "events.delete_event_confirmation" }, { title: deleteDialog.eventTitle })}
        confirmText={intl.formatMessage({ id: "events.delete" })}
        cancelText={intl.formatMessage({ id: "events.cancel" })}
        variant="delete"
        isDestructive={true}
      />

      {/* Delete File Dialog */}
      <ConfirmationDialog
        open={fileDeleteDialog.open}
        onOpenChange={(open) => setFileDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={handleRemoveFile}
        onCancel={closeFileDeleteDialog}
        title={intl.formatMessage({ id: "events.remove_file" })}
        message={intl.formatMessage({ id: "events.remove_file_confirmation" }, { fileName: fileDeleteDialog.fileName })}
        confirmText={intl.formatMessage({ id: "events.remove" })}
        cancelText={intl.formatMessage({ id: "events.cancel" })}
        variant="delete"
        isDestructive={true}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={imagePreviewDialog.open}
        onClose={closeImagePreview}
        imageUrl={imagePreviewDialog.imageUrl}
        title={imagePreviewDialog.title}
      />
    </>
  );
}