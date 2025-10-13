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
import { FormField } from "@/components/shared/FormField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Upload,
  Loader2,
  Save,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface AboutSectionsTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function AboutSectionsTab({
  businessInfo,
  onUpdate,
}: AboutSectionsTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [showMainSettingsDialog, setShowMainSettingsDialog] = useState(false);

  // Main About Settings State
  const [mainSettings, setMainSettings] = useState({
    hero_image: businessInfo?.about?.hero_image || "",
    main_title_ar: businessInfo?.about?.main_title_ar || "",
    main_title_en: businessInfo?.about?.main_title_en || "",
    main_description_ar: businessInfo?.about?.main_description_ar || "",
    main_description_en: businessInfo?.about?.main_description_en || "",
  });

  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    hero_image: "",
    display_order: 0,
  });

  const aboutSections = businessInfo?.about?.sections || [];

  const saveMainSettingsMutation = useMutation({
    mutationFn: async (data: typeof mainSettings) => {
      return axiosInstance.put(
        `/business-info/${businessInfo._id}/about-settings`,
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
    setEditingSection(null);
    setFormData({
      title_ar: "",
      title_en: "",
      description_ar: "",
      description_en: "",
      hero_image: "",
      display_order: aboutSections.length,
    });
    setShowDialog(true);
  }

  function handleEdit(section: any) {
    setEditingSection(section);
    setFormData({
      title_ar: section.title_ar || "",
      title_en: section.title_en || "",
      description_ar: section.description_ar || "",
      description_en: section.description_en || "",
      hero_image: section.hero_image || "",
      display_order: section.display_order || 0,
    });
    setShowDialog(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingSection
        ? `/business-info/${businessInfo._id}/about-sections/${editingSection._id}`
        : `/business-info/${businessInfo._id}/about-sections`;
      const method = editingSection ? "put" : "post";

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
    mutationFn: (sectionId: string) =>
      axiosInstance.delete(
        `/business-info/${businessInfo._id}/about-sections/${sectionId}`
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
   const deleteConfirm = useDeleteConfirm({
    onConfirm: async (sectionId) => {
      if (sectionId) {
        await deleteMutation.mutateAsync(sectionId);
      }
    },
    itemName: intl.formatMessage({ id: "business_info.section" }),
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
        options: { folder: "business/about", prefix: "about_section" },
      });

      if (isMainImage) {
        setMainSettings((prev) => ({ ...prev, hero_image: url }));
      } else {
        setFormData((prev) => ({ ...prev, hero_image: url }));
      }
    } finally {
      e.target.value = "";
    }
  }

  function handleSave() {
    if (!formData.hero_image) {
      toast.error(
        intl.formatMessage({ id: "business_info.hero_image_required" })
      );
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

  return (
    <div className="space-y-6">
      {/* Main About Settings Card */}
      <SectionCard
        title={intl.formatMessage({ id: "business_info.about_main_settings" })}
        description={intl.formatMessage({
          id: "business_info.about_main_settings_desc",
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
                {businessInfo?.about?.hero_image ? (
                  <img
                    src={businessInfo.about.hero_image}
                    alt="About Hero"
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
                    ? businessInfo?.about?.main_title_ar || "لم يتم التعيين"
                    : businessInfo?.about?.main_title_en || "Not Set"}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-1 block">
                  {intl.formatMessage({ id: "business_info.main_description" })}
                </Label>
                <p className="text-gray-700">
                  {intl.locale === "ar"
                    ? businessInfo?.about?.main_description_ar ||
                      "لم يتم التعيين"
                    : businessInfo?.about?.main_description_en || "Not Set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* About Sections Card */}
      <SectionCard
        title={intl.formatMessage({ id: "business_info.about_sections" })}
        description={intl.formatMessage({
          id: "business_info.about_sections_desc",
        })}
        headerAction={
          <Button onClick={handleAdd} size="sm" className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.add_section" })}
          </Button>
        }
      >
        {aboutSections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{intl.formatMessage({ id: "business_info.no_sections" })}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aboutSections
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((section: any) => (
                <div
                  key={section._id}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Hero Image */}
                    {section.hero_image && (
                      <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden border">
                        <img
                          src={section.hero_image}
                          alt={section.title_en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {intl.locale === "ar"
                            ? section.title_ar
                            : section.title_en}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {intl.formatMessage({ id: "business_info.order" })}:{" "}
                          {section.display_order}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {intl.locale === "ar"
                          ? section.description_ar
                          : section.description_en}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(section)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {intl.formatMessage({ id: "business_info.edit" })}
                        </Button>
                        <Button
                          variant="destructive"
                          className="text-white"
                          size="sm"
                            onClick={() => deleteConfirm.showConfirm(section._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {intl.formatMessage({ id: "business_info.delete" })}
                        </Button>
                      </div>
                    </div>
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
              {intl.formatMessage({ id: "business_info.about_main_settings" })}
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

                <FormField
                  id="hero_image_url"
                  label=""
                  value={mainSettings.hero_image}
                  onChange={(e: any) =>
                    setMainSettings({
                      ...mainSettings,
                      hero_image: e.target.value,
                    })
                  }
                  disabled={isSavingMain || isUploading}
                  placeholder="Or paste image URL"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Main Title Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="main_title_ar"
                label={intl.formatMessage({
                  id: "business_info.main_title_ar",
                })}
                value={mainSettings.main_title_ar}
                onChange={(e: any) =>
                  setMainSettings({
                    ...mainSettings,
                    main_title_ar: e.target.value,
                  })
                }
                disabled={isSavingMain}
                dir="rtl"
                placeholder="من نحن"
              />

              <FormField
                id="main_title_en"
                label={intl.formatMessage({
                  id: "business_info.main_title_en",
                })}
                value={mainSettings.main_title_en}
                onChange={(e: any) =>
                  setMainSettings({
                    ...mainSettings,
                    main_title_en: e.target.value,
                  })
                }
                disabled={isSavingMain}
                placeholder="About Us"
              />
            </div>

            {/* Main Description Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="main_description_ar"
                label={intl.formatMessage({
                  id: "business_info.main_description_ar",
                })}
                variant="textarea"
                value={mainSettings.main_description_ar}
                onChange={(e: any) =>
                  setMainSettings({
                    ...mainSettings,
                    main_description_ar: e.target.value,
                  })
                }
                disabled={isSavingMain}
                rows={3}
                dir="rtl"
                placeholder="نبذة عن الشركة..."
              />

              <FormField
                id="main_description_en"
                label={intl.formatMessage({
                  id: "business_info.main_description_en",
                })}
                variant="textarea"
                value={mainSettings.main_description_en}
                onChange={(e: any) =>
                  setMainSettings({
                    ...mainSettings,
                    main_description_en: e.target.value,
                  })
                }
                disabled={isSavingMain}
                rows={3}
                placeholder="Brief about the company..."
              />
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

      {/* Add/Edit Section Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection
                ? intl.formatMessage({ id: "business_info.edit_section" })
                : intl.formatMessage({ id: "business_info.add_section" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hero Image Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">
                {intl.formatMessage({ id: "business_info.hero_image" })} *
              </Label>

              <div className="space-y-3">
                {formData.hero_image && (
                  <div className="w-full h-48 rounded-lg overflow-hidden border bg-white">
                    <img
                      src={formData.hero_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
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

                  {formData.hero_image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, hero_image: "" })
                      }
                      disabled={isSaving || isUploading}
                    >
                      {intl.formatMessage({ id: "business_info.remove" })}
                    </Button>
                  )}
                </div>

                <FormField
                  id="hero_image_url"
                  label=""
                  value={formData.hero_image}
                  onChange={(e: any) =>
                    setFormData({ ...formData, hero_image: e.target.value })
                  }
                  disabled={isSaving || isUploading}
                  placeholder="Or paste image URL"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Title Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="title_ar"
                label={intl.formatMessage({ id: "business_info.title_ar" })}
                value={formData.title_ar}
                onChange={(e: any) =>
                  setFormData({ ...formData, title_ar: e.target.value })
                }
                disabled={isSaving}
                dir="rtl"
                placeholder="رؤيتنا، رسالتنا، قيمنا..."
              />

              <FormField
                id="title_en"
                label={intl.formatMessage({ id: "business_info.title_en" })}
                value={formData.title_en}
                onChange={(e: any) =>
                  setFormData({ ...formData, title_en: e.target.value })
                }
                disabled={isSaving}
                placeholder="Our Vision, Our Mission, Our Values..."
              />
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="description_ar"
                label={intl.formatMessage({
                  id: "business_info.description_ar",
                })}
                variant="textarea"
                value={formData.description_ar}
                onChange={(e: any) =>
                  setFormData({ ...formData, description_ar: e.target.value })
                }
                disabled={isSaving}
                rows={5}
                dir="rtl"
              />

              <FormField
                id="description_en"
                label={intl.formatMessage({
                  id: "business_info.description_en",
                })}
                variant="textarea"
                value={formData.description_en}
                onChange={(e: any) =>
                  setFormData({ ...formData, description_en: e.target.value })
                }
                disabled={isSaving}
                rows={5}
              />
            </div>

            {/* Display Order */}
            <FormField
              id="display_order"
              label={intl.formatMessage({ id: "business_info.display_order" })}
              type="number"
              value={formData.display_order}
              onChange={(e: any) =>
                setFormData({
                  ...formData,
                  display_order: Number(e.target.value),
                })
              }
              disabled={isSaving}
            />

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
                className="text-white"
                onClick={handleSave}
                disabled={isSaving || isUploading}
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