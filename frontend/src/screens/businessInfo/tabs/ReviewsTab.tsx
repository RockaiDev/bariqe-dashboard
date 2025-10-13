import { useState } from "react";
import { useIntl } from "react-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Upload,
  Loader2,
  MessageSquare,
  User,
  Settings,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface ReviewsTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function ReviewsTab({
  businessInfo,
  onUpdate,
}: ReviewsTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();
  const [showDialog, setShowDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showMainSettingsDialog, setShowMainSettingsDialog] = useState(false);

  // Main Reviews Settings State
  const [mainSettings, setMainSettings] = useState({
    hero_image: businessInfo?.reviews?.hero_image || "",
    main_title_ar: businessInfo?.reviews?.main_title_ar || "آراء عملائنا",
    main_title_en: businessInfo?.reviews?.main_title_en || "Client Reviews",
    main_description_ar:
      businessInfo?.reviews?.main_description_ar || "نفتخر بثقة عملائنا",
    main_description_en:
      businessInfo?.reviews?.main_description_en ||
      "We are proud of our clients trust",
  });

  const [formData, setFormData] = useState({
    client_name_ar: "",
    client_name_en: "",
    client_position_ar: "",
    client_position_en: "",
    client_company_ar: "",
    client_company_en: "",
    review_ar: "",
    review_en: "",
    rating: 5,
    is_featured: false,
    display_order: 0,
    client_image: "",
  });

  const reviews = businessInfo?.reviews?.items || [];

  // Save Main Settings Mutation
  const saveMainSettingsMutation = useMutation({
    mutationFn: async (data: typeof mainSettings) => {
      return axiosInstance.put(
        `/business-info/${businessInfo._id}/reviews-settings`,
        data
      );
    },
    onSuccess: () => {
      toast.success(
        intl.formatMessage({ id: "business_info.saved_successfully" })
      );
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
      setShowMainSettingsDialog(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.save_failed" })
      );
    },
  });

  function handleAdd() {
    setEditingReview(null);
    setFormData({
      client_name_ar: "",
      client_name_en: "",
      client_position_ar: "",
      client_position_en: "",
      client_company_ar: "",
      client_company_en: "",
      review_ar: "",
      review_en: "",
      rating: 5,
      is_featured: false,
      display_order: reviews.length,
      client_image: "",
    });
    setShowDialog(true);
  }

  function handleEdit(review: any) {
    setEditingReview(review);
    setFormData({
      client_name_ar: review.client_name_ar || "",
      client_name_en: review.client_name_en || "",
      client_position_ar: review.client_position_ar || "",
      client_position_en: review.client_position_en || "",
      client_company_ar: review.client_company_ar || "",
      client_company_en: review.client_company_en || "",
      review_ar: review.review_ar || "",
      review_en: review.review_en || "",
      rating: review.rating || 5,
      is_featured: review.is_featured || false,
      display_order: review.display_order || 0,
      client_image: review.client_image || "",
    });
    setShowDialog(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingReview
        ? `/business-info/${businessInfo._id}/reviews/${editingReview._id}`
        : `/business-info/${businessInfo._id}/reviews`;
      const method = editingReview ? "put" : "post";

      return axiosInstance[method](endpoint, data);
    },
    onSuccess: () => {
      toast.success(
        intl.formatMessage({ id: "business_info.saved_successfully" })
      );
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
      setShowDialog(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.save_failed" })
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) =>
      axiosInstance.delete(
        `/business-info/${businessInfo._id}/reviews/${reviewId}`
      ),
    onSuccess: () => {
      toast.success(
        intl.formatMessage({ id: "business_info.deleted_successfully" })
      );
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.delete_failed" })
      );
    },
  });

  async function handleImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    isMainImage = false
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        intl.formatMessage({ id: "business_info.invalid_file_type" })
      );
      return;
    }

    try {
      const url = await uploadImage.mutateAsync({
        file,
        options: {
          folder: "business/reviews",
          prefix: isMainImage ? "hero" : "client",
        },
      });

      if (isMainImage) {
        setMainSettings((prev) => ({ ...prev, hero_image: url }));
      } else {
        setFormData((prev) => ({ ...prev, client_image: url }));
      }
    } finally {
      e.target.value = "";
    }
  }
   const deleteConfirm = useDeleteConfirm({
    onConfirm: async (sectionId) => {
      if (sectionId) {
        await deleteMutation.mutateAsync(sectionId);
      }
    },
    itemName: intl.formatMessage({ id: "business_info.section" }),
  });

  function handleSave() {
    if (!formData.client_name_ar || !formData.client_name_en) {
      toast.error(intl.formatMessage({ id: "business_info.name_required" }));
      return;
    }

    if (!formData.review_ar || !formData.review_en) {
      toast.error(intl.formatMessage({ id: "business_info.review_required" }));
      return;
    }

    if (!businessInfo?._id) {
      toast.error(
        intl.formatMessage({ id: "business_info.create_business_first" })
      );
      return;
    }

    saveMutation.mutate(formData);
  }



  const isSaving = saveMutation.isPending;
  const isUploading = uploadImage.isPending;
  const isSavingMain = saveMainSettingsMutation.isPending;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Main Reviews Settings Card */}
      <SectionCard
        title={intl.formatMessage({
          id: "business_info.reviews_main_settings",
        })}
        description={intl.formatMessage({
          id: "business_info.reviews_main_settings_desc",
        })}
        headerAction={
          <Button
            onClick={() => setShowMainSettingsDialog(true)}
            size="sm"
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.edit_settings" })}
          </Button>
        }
      >
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hero Image Preview */}
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">
                {intl.formatMessage({ id: "business_info.hero_image" })}
              </Label>
              <div className="w-full h-48 bg-white rounded-lg overflow-hidden border">
                {businessInfo?.reviews?.hero_image ? (
                  <img
                    src={businessInfo.reviews.hero_image}
                    alt="Reviews Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Main Title & Description */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">
                  {intl.formatMessage({ id: "business_info.main_title" })}
                </Label>
                <p className="font-semibold text-lg">
                  {intl.locale === "ar"
                    ? businessInfo?.reviews?.main_title_ar || "آراء عملائنا"
                    : businessInfo?.reviews?.main_title_en || "Client Reviews"}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-1 block">
                  {intl.formatMessage({ id: "business_info.main_description" })}
                </Label>
                <p className="text-gray-700">
                  {intl.locale === "ar"
                    ? businessInfo?.reviews?.main_description_ar ||
                      "نفتخر بثقة عملائنا"
                    : businessInfo?.reviews?.main_description_en ||
                      "We are proud of our clients trust"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Reviews List Card */}
      <SectionCard
        title={intl.formatMessage({ id: "business_info.reviews" })}
        description={intl.formatMessage({ id: "business_info.reviews_desc" })}
        headerAction={
          <Button onClick={handleAdd} size="sm" className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.add_review" })}
          </Button>
        }
      >
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{intl.formatMessage({ id: "business_info.no_reviews" })}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((review: any) => (
                <div
                  key={review._id}
                  className={`bg-white border rounded-lg p-5 hover:shadow-md transition-shadow ${
                    review.is_featured ? "border-yellow-400 border-2" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {review.client_image ? (
                        <img
                          src={review.client_image}
                          alt={review.client_name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 truncate">
                            {intl.locale === "ar"
                              ? review.client_name_ar
                              : review.client_name_en}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {intl.locale === "ar"
                              ? review.client_position_ar
                              : review.client_position_en}
                          </p>
                          {review.client_company_ar ||
                          review.client_company_en ? (
                            <p className="text-xs text-gray-500 truncate">
                              {intl.locale === "ar"
                                ? review.client_company_ar
                                : review.client_company_en}
                            </p>
                          ) : null}
                        </div>
                        {review.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4 italic">
                    "
                    {intl.locale === "ar"
                      ? review.review_ar
                      : review.review_en}
                    "
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(review)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      {intl.formatMessage({ id: "business_info.edit" })}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                       onClick={() => deleteConfirm.showConfirm(review._id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 text-white"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {intl.formatMessage({ id: "business_info.delete" })}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      {/* Main Settings Dialog */}
      <Dialog
        open={showMainSettingsDialog}
        onOpenChange={setShowMainSettingsDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage({
                id: "business_info.reviews_main_settings",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hero Image Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">
                {intl.formatMessage({ id: "business_info.hero_image" })}
              </Label>

              <div className="space-y-3">
                {mainSettings.hero_image && (
                  <div className="w-full h-48 rounded-lg overflow-hidden border bg-white">
                    <img
                      src={mainSettings.hero_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {!mainSettings.hero_image && (
                  <div className="w-full h-48 rounded-lg border-2 border-dashed bg-white flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {intl.formatMessage({ id: "business_info.no_image" })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, true)}
                      disabled={isSavingMain || isUploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSavingMain || isUploading}
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        )?.click();
                      }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {intl.formatMessage({
                            id: "business_info.uploading",
                          })}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {intl.formatMessage({
                            id: "business_info.upload_image",
                          })}
                        </>
                      )}
                    </Button>
                  </label>

                  {mainSettings.hero_image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMainSettings({ ...mainSettings, hero_image: "" })
                      }
                      disabled={isSavingMain || isUploading}
                    >
                      {intl.formatMessage({ id: "business_info.remove" })}
                    </Button>
                  )}
                </div>

                <Input
                  value={mainSettings.hero_image}
                  onChange={(e) =>
                    setMainSettings({
                      ...mainSettings,
                      hero_image: e.target.value,
                    })
                  }
                  disabled={isSavingMain || isUploading}
                  placeholder={intl.formatMessage({
                    id: "business_info.or_paste_image_url",
                  })}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Main Title Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="main_title_ar">
                  {intl.formatMessage({ id: "business_info.main_title_ar" })}
                </Label>
                <Input
                  id="main_title_ar"
                  value={mainSettings.main_title_ar}
                  onChange={(e) =>
                    setMainSettings({
                      ...mainSettings,
                      main_title_ar: e.target.value,
                    })
                  }
                  disabled={isSavingMain}
                  dir="rtl"
                  placeholder="آراء عملائنا"
                />
              </div>

              <div>
                <Label htmlFor="main_title_en">
                  {intl.formatMessage({ id: "business_info.main_title_en" })}
                </Label>
                <Input
                  id="main_title_en"
                  value={mainSettings.main_title_en}
                  onChange={(e) =>
                    setMainSettings({
                      ...mainSettings,
                      main_title_en: e.target.value,
                    })
                  }
                  disabled={isSavingMain}
                  placeholder="Client Reviews"
                />
              </div>
            </div>

            {/* Main Description Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="main_description_ar">
                  {intl.formatMessage({
                    id: "business_info.main_description_ar",
                  })}
                </Label>
                <Textarea
                  id="main_description_ar"
                  value={mainSettings.main_description_ar}
                  onChange={(e) =>
                    setMainSettings({
                      ...mainSettings,
                      main_description_ar: e.target.value,
                    })
                  }
                  disabled={isSavingMain}
                  rows={3}
                  dir="rtl"
                  placeholder="نفتخر بثقة عملائنا..."
                />
              </div>

              <div>
                <Label htmlFor="main_description_en">
                  {intl.formatMessage({
                    id: "business_info.main_description_en",
                  })}
                </Label>
                <Textarea
                  id="main_description_en"
                  value={mainSettings.main_description_en}
                  onChange={(e) =>
                    setMainSettings({
                      ...mainSettings,
                      main_description_en: e.target.value,
                    })
                  }
                  disabled={isSavingMain}
                  rows={3}
                  placeholder="We are proud of our clients trust..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMainSettingsDialog(false)}
                disabled={isSavingMain || isUploading}
              >
                {intl.formatMessage({ id: "business_info.cancel" })}
              </Button>
              <Button
                className="text-white"
                onClick={() => saveMainSettingsMutation.mutate(mainSettings)}
                disabled={isSavingMain || isUploading}
              >
                {isSavingMain ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {intl.formatMessage({ id: "business_info.saving" })}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {intl.formatMessage({ id: "business_info.save" })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Review Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReview
                ? intl.formatMessage({ id: "business_info.edit_review" })
                : intl.formatMessage({ id: "business_info.add_review" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client Image Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">
                {intl.formatMessage({ id: "business_info.client_image" })}
              </Label>

              <div className="space-y-3">
                {formData.client_image && (
                  <div className="w-full h-48 rounded-lg overflow-hidden border bg-white">
                    <img
                      src={formData.client_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {!formData.client_image && (
                  <div className="w-full h-48 rounded-lg border-2 border-dashed bg-white flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {intl.formatMessage({ id: "business_info.no_image" })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, false)}
                      disabled={isSaving || isUploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving || isUploading}
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        )?.click();
                      }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {intl.formatMessage({
                            id: "business_info.uploading",
                          })}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {intl.formatMessage({
                            id: "business_info.upload_image",
                          })}
                        </>
                      )}
                    </Button>
                  </label>

                  {formData.client_image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, client_image: "" })
                      }
                      disabled={isSaving || isUploading}
                    >
                      {intl.formatMessage({ id: "business_info.remove" })}
                    </Button>
                  )}
                </div>

                <Input
                  value={formData.client_image}
                  onChange={(e) =>
                    setFormData({ ...formData, client_image: e.target.value })
                  }
                  disabled={isSaving || isUploading}
                  placeholder={intl.formatMessage({
                    id: "business_info.or_paste_image_url",
                  })}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name_ar">
                  {intl.formatMessage({
                    id: "business_info.client_name_ar",
                  })}{" "}
                  *
                </Label>
                <Input
                  id="client_name_ar"
                  value={formData.client_name_ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_name_ar: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="محمد أحمد"
                />
              </div>

              <div>
                <Label htmlFor="client_name_en">
                  {intl.formatMessage({
                    id: "business_info.client_name_en",
                  })}{" "}
                  *
                </Label>
                <Input
                  id="client_name_en"
                  value={formData.client_name_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_name_en: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  placeholder="Mohammed Ahmed"
                />
              </div>

              <div>
                <Label htmlFor="client_position_ar">
                  {intl.formatMessage({
                    id: "business_info.position_ar",
                  })}
                </Label>
                <Input
                  id="client_position_ar"
                  value={formData.client_position_ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_position_ar: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="المدير التنفيذي"
                />
              </div>

              <div>
                <Label htmlFor="client_position_en">
                  {intl.formatMessage({
                    id: "business_info.position_en",
                  })}
                </Label>
                <Input
                  id="client_position_en"
                  value={formData.client_position_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_position_en: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  placeholder="CEO"
                />
              </div>

              <div>
                <Label htmlFor="client_company_ar">
                  {intl.formatMessage({
                    id: "business_info.company_ar",
                  })}
                </Label>
                <Input
                  id="client_company_ar"
                  value={formData.client_company_ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_company_ar: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="شركة الأمل للتقنية"
                />
              </div>

              <div>
                <Label htmlFor="client_company_en">
                  {intl.formatMessage({
                    id: "business_info.company_en",
                  })}
                </Label>
                <Input
                  id="client_company_en"
                  value={formData.client_company_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_company_en: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  placeholder="Al-Amal Tech Company"
                />
              </div>
            </div>

            {/* Review Text */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="review_ar">
                  {intl.formatMessage({ id: "business_info.review_ar" })} *
                </Label>
                <Textarea
                  id="review_ar"
                  value={formData.review_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, review_ar: e.target.value })
                  }
                  disabled={isSaving}
                  rows={4}
                  dir="rtl"
                  placeholder="خدمة ممتازة وجودة عالية..."
                />
              </div>

              <div>
                <Label htmlFor="review_en">
                  {intl.formatMessage({ id: "business_info.review_en" })} *
                </Label>
                <Textarea
                  id="review_en"
                  value={formData.review_en}
                  onChange={(e) =>
                    setFormData({ ...formData, review_en: e.target.value })
                  }
                  disabled={isSaving}
                  rows={4}
                  placeholder="Excellent service and high quality..."
                />
              </div>
            </div>

            {/* Rating & Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rating">
                  {intl.formatMessage({ id: "business_info.rating" })}
                </Label>
                <select
                  id="rating"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: Number(e.target.value),
                    })
                  }
                  disabled={isSaving}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}{" "}
                      {r === 1
                        ? intl.formatMessage({ id: "business_info.star" })
                        : intl.formatMessage({ id: "business_info.stars" })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="display_order">
                  {intl.formatMessage({
                    id: "business_info.display_order",
                  })}
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: Number(e.target.value),
                    })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_featured: e.target.checked,
                    })
                  }
                  disabled={isSaving}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_featured" className="cursor-pointer">
                  {intl.formatMessage({ id: "business_info.is_featured" })}
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSaving || isUploading}
              >
                {intl.formatMessage({ id: "business_info.cancel" })}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="text-white"
              >
                {isSaving
                  ? intl.formatMessage({ id: "business_info.saving" })
                  : intl.formatMessage({ id: "business_info.save" })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
       <DeleteConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}