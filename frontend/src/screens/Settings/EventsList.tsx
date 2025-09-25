import { useState } from 'react';
import { useIntl } from 'react-intl';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SectionCard from './SectionCard';
import { Button } from "@/components/ui/button";
import LoadingComponent from "@/components/shared/LoadingComponent";
import toast from 'react-hot-toast';
import {
  useEvents,
  useEvent,
  useRemoveEventFile,
  type Event, // استيراد النوع من الـ hook
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
  Upload
} from 'lucide-react';

// Form validation schema for editing
const editEventSchema = z.object({
  titleAr: z.string().min(1, 'Arabic title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  date: z.string().min(1, 'Date is required'),
  tags: z.string().optional(),
  contentAr: z.string().min(1, 'Arabic content is required'),
  contentEn: z.string().min(1, 'English content is required'),
  status: z.enum(['draft', 'published', 'archived']),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

// استخدام النوع Event من الـ hook بدلاً من LocalEvent
// type LocalEvent = Event; // يمكنك استخدام هذا إذا كنت تريد الاحتفاظ باسم LocalEvent

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(intl.formatMessage({ id: "events.please_select_image_file" }));
      return;
    }
    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setEditingImageUrl(url);
    setRemoveExistingImage(false);
    toast.success(intl.formatMessage({ id: "events.image_selected" }));
  };

  // Build queries based on filters
  const queries = [];
  if (searchTerm) {
    // البحث في العناوين باللغتين
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

  // React Hook Form for editing
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
  });

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(intl.formatMessage({ id: "events.confirm_delete" }, { title }))) {
      try {
        await del.mutateAsync(id);
      } catch (error: any) {
        console.error('Delete error:', error);
        const errorMessage = error.response?.data?.message || error.message || intl.formatMessage({ id: "events.failed_to_delete_event" });
        toast.error(errorMessage);
      }
    }
  };

  const handleRemoveFile = async (eventId: string, fileId: string, fileName: string) => {
    if (window.confirm(intl.formatMessage({ id: "events.confirm_remove_file" }, { fileName }))) {
      await removeFileMutation.mutateAsync({ eventId, fileId });
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
    setValue('tags', event.tags?.join(', ') || '');
    setValue('contentAr', event.contentAr);
    setValue('contentEn', event.contentEn);
    setValue('status', event.status);
    setSelectedFiles([]);
    setEditingImageUrl(event.image || null);
    setOriginalImageUrl(event.image || null);
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
        formData.append('image', selectedImageFile);
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
    if (mimetype.startsWith('image/')) return <FileImage className="h-4 w-4 text-green-600" />;
    if (mimetype === 'application/pdf') return <FileText className="h-4 w-4 text-red-600" />;
    return <FilePlus2 className="h-4 w-4 text-blue-600" />;
  };

  // Helper function to get title based on current locale
  const getEventTitle = (event: Event) => {
    return intl.locale === 'ar' ? event.titleAr : event.titleEn;
  };

  // Helper function to get content based on current locale
  const getEventContent = (event: Event) => {
    return intl.locale === 'ar' ? event.contentAr : event.contentEn;
  };

  if (list.isLoading) {
    return <LoadingComponent />;
  }

  if (list.isError) {
    console.error('List error:', list.error);
    return (
      <SectionCard title={intl.formatMessage({ id: "events.events" })}>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{intl.formatMessage({ id: "events.failed_to_load_events" })}</h3>
          <p className="text-red-600 mb-4">
            {list.error?.message || intl.formatMessage({ id: "events.error_occurred_loading_events" })}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => list.refetch()} 
              variant="outline" 
              size="sm" 
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
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
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">{intl.formatMessage({ id: "events.show_error_details" })}</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto text-left">
              {JSON.stringify(list.error, null, 2)}
            </pre>
          </details>
        </div>
      </SectionCard>
    );
  }

  const eventsData = list.data;
  const events: Event[] = eventsData?.data || [];
  const totalPages = eventsData?.totalPages || 1;
  const totalItems = eventsData?.totalItems || 0;

  return (
    <SectionCard title={intl.formatMessage({ id: "events.events_management" }, { count: totalItems })}>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={intl.formatMessage({ id: "events.search_events_by_title" })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pr-10 pl-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
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
            >
              <RefreshCw className={`h-4 w-4 ${list.isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">{intl.formatMessage({ id: "events.no_events_found" })}</p>
            <p className="text-gray-400 text-sm mt-2">
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
                className="mt-4"
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
              <div className="p-6">
                {editingEventId === event._id ? (
                  /* Edit Form */
                  <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* العنوان بالعربية */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.event_title_ar_required" })}
                        </label>
                        <input
                          {...register('titleAr')}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.event_title_en_required" })}
                        </label>
                        <input
                          {...register('titleEn')}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
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
                        />
                        {errors.date && (
                          <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                        )}
                      </div>

                      {/* العلامات */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.tags" })}
                        </label>
                        <input
                          {...register('tags')}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder={intl.formatMessage({ id: "events.tags_placeholder" })}
                        />
                      </div>

                      {/* الحالة */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.status" })}
                        </label>
                        <select
                          {...register('status')}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="draft">{intl.formatMessage({ id: "events.draft" })}</option>
                          <option value="published">{intl.formatMessage({ id: "events.published" })}</option>
                          <option value="archived">{intl.formatMessage({ id: "events.archived" })}</option>
                        </select>
                      </div>
                    </div>

                    {/* المحتوى */}
                    <div className="space-y-4">
                      {/* المحتوى بالعربية */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.event_content_ar_required" })}
                        </label>
                        <textarea
                          {...register('contentAr')}
                          rows={4}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {intl.formatMessage({ id: "events.event_content_en_required" })}
                        </label>
                        <textarea
                          {...register('contentEn')}
                          rows={4}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
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

                    {/* Image (edit) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{intl.formatMessage({ id: "events.event_image" })}</label>
                      {editingImageUrl ? (
                        <div className="mb-2">
                          <img src={editingImageUrl} alt="Preview" className="w-48 h-auto rounded-md object-cover" />
                        </div>
                      ) : originalImageUrl && !removeExistingImage ? (
                        <div className="mb-2">
                          <img src={originalImageUrl} alt="Current" className="w-48 h-auto rounded-md object-cover" />
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="text-sm text-gray-500" 
                        />
                        {originalImageUrl && !removeExistingImage && (
                          <button 
                            type="button" 
                            onClick={() => { 
                              setRemoveExistingImage(true); 
                              setEditingImageUrl(null); 
                              setSelectedImageFile(null); 
                            }} 
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            {intl.formatMessage({ id: "events.remove_existing" })}
                          </button>
                        )}
                        {removeExistingImage && (
                          <span className="text-sm text-gray-500">{intl.formatMessage({ id: "events.existing_image_will_be_removed" })}</span>
                        )}
                      </div>
                    </div>

                    {/* Add New Files */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {intl.formatMessage({ id: "events.add_new_files" })}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          {intl.formatMessage({ id: "events.select_additional_files" })}
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                        />
                      </div>

                      {/* Selected New Files */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {intl.formatMessage({ id: "events.new_files_to_add" }, { count: selectedFiles.length })}:
                          </p>
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-blue-50 p-2 rounded border"
                            >
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeNewFile(index)}
                                className="text-red-500 hover:text-red-700 mr-2"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={update.isPending}
                      >
                        <X className="h-4 w-4 ml-2" />
                        {intl.formatMessage({ id: "events.cancel" })}
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={update.isPending}
                        className="bg-primary text-white hover:bg-primary/85"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        {update.isPending ? intl.formatMessage({ id: "events.saving" }) : intl.formatMessage({ id: "events.save_changes" })}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                  <div className="flex items-start justify-between md:flex-row flex-col gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {getEventTitle(event)}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {intl.formatMessage({ id: `events.${event.status}` })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.date ? format(new Date(event.date), 'PPP', { locale: ar }) : intl.formatMessage({ id: "events.no_date" })}
                          </span>
                        </div>
                        {event.createdAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(event.createdAt), 'PPp', { locale: ar })}</span>
                          </div>
                        )}
                        {event.author && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{event.author}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{event.tags.length - 3} {intl.formatMessage({ id: "events.more" })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content Preview */}
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {getEventContent(event)}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {event.files && event.files.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {intl.formatMessage({ id: "events.files_count" }, { count: event.files.length })}
                          </span>
                        )}
                        {event.updatedAt && (
                          <span>
                            {intl.formatMessage({ id: "events.updated" })}: {format(new Date(event.updatedAt), 'PP', { locale: ar })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mr-6">
                      <Button
                        onClick={() => startEdit(event)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={editingEventId !== null}
                      >
                        <Edit3 className="h-4 w-4" />
                        {intl.formatMessage({ id: "events.edit" })}
                      </Button>

                      <Button
                        onClick={() => toggleEventView(event._id!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {selectedEventId === event._id ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            {intl.formatMessage({ id: "events.hide" })}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            {intl.formatMessage({ id: "events.view" })}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(event._id!, getEventTitle(event))}
                        disabled={del.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedEventId === event._id && editingEventId !== event._id && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {eventLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">{intl.formatMessage({ id: "events.loading_details" })}</p>
                    </div>
                  ) : selectedEvent ? (
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Content */}
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {intl.formatMessage({ id: "events.full_content" })}
                          </h5>
                          
                          {/* عرض المحتوى بالعربية */}
                          <div className="mb-4">
                            <h6 className="font-medium text-gray-700 mb-2">{intl.formatMessage({ id: "events.arabic_content" })}</h6>
                            <div className="bg-white p-4 rounded-lg border text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto" dir="rtl">
                              {selectedEvent.contentAr}
                            </div>
                          </div>
                          
                          {/* عرض المحتوى بالإنجليزية */}
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">{intl.formatMessage({ id: "events.english_content" })}</h6>
                            <div className="bg-white p-4 rounded-lg border text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto" dir="ltr">
                              {selectedEvent.contentEn}
                            </div>
                          </div>
                        </div>

                        {/* Files */}
                        <div>
                          {selectedEvent.files && selectedEvent.files.length > 0 ? (
                            <>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FilePlus2 className="h-4 w-4" />
                                {intl.formatMessage({ id: "events.attached_files" }, { count: selectedEvent.files.length })}
                              </h5>
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {selectedEvent.files.map((file) => (
                                  <div
                                    key={file._id}
                                    className="flex items-center justify-between bg-white p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                                      {getFileIcon(file.mimetype)}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {file.originalName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimetype}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => handleRemoveFile(selectedEvent._id!, file._id, file.originalName)}
                                      disabled={removeFileMutation.isPending}
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50 mr-3 flex-shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FilePlus2 className="mx-auto h-8 w-8 mb-2" />
                              <p>{intl.formatMessage({ id: "events.no_files_attached" })}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Section */}
                      <div className="mt-6">
                        {(selectedEvent as any)?.image ? (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <ImagePlus className="h-4 w-4" />
                              {intl.formatMessage({ id: "events.event_image" })}
                            </h5>
                            <img
                              src={(selectedEvent as any).image}
                              alt="Event"
                              className="w-full max-w-md h-auto rounded-lg border"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <ImagePlus className="mx-auto h-8 w-8 mb-2" />
                            <p>{intl.formatMessage({ id: "events.no_image_attached" })}</p>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      {selectedEvent.createdAt && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-500">
                            <div>
                              <span className="font-medium">{intl.formatMessage({ id: "events.created" })}:</span>{' '}
                              {format(new Date(selectedEvent.createdAt), 'PPpp', { locale: ar })}
                            </div>
                            {selectedEvent.updatedAt && selectedEvent.updatedAt !== selectedEvent.createdAt && (
                              <div>
                                <span className="font-medium">{intl.formatMessage({ id: "events.updated" })}:</span>{' '}
                                {format(new Date(selectedEvent.updatedAt), 'PPpp', { locale: ar })}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">{intl.formatMessage({ id: "events.status" })}:</span>{' '}
                              <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(selectedEvent.status)}`}>
                                {intl.formatMessage({ id: `events.${selectedEvent.status}` })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-red-600">
                      <p>{intl.formatMessage({ id: "events.failed_to_load_event_details" })}</p>
                      <Button 
                        onClick={() => setSelectedEventId(null)} 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-4 space-x-reverse">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || list.isLoading}
            variant="outline"
            size="sm"
          >
            {intl.formatMessage({ id: "events.previous" })}
          </Button>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage > totalPages - 3) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={currentPage === pageNum ? "bg-primary text-white" : ""}
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
          >
            {intl.formatMessage({ id: "events.next" })}
          </Button>
        </div>
      )}

      {/* Page Info */}
      <div className="text-center mt-4 text-sm text-gray-500">
        {intl.formatMessage({ id: "events.showing_page" }, { 
          currentPage, 
          totalPages, 
          totalItems 
        })}
      </div>
    </SectionCard>
  );
}