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
  Building2,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface PartnersTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function PartnersTab({
  businessInfo,
  onUpdate,
}: PartnersTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    website: "",
    image: "",
    display_order: 0,
  });

  const partners = businessInfo?.partners || [];

  function handleAdd() {
    setEditingPartner(null);
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      website: "",
      image: "",
      display_order: partners.length,
    });
    setShowDialog(true);
  }

  function handleEdit(partner: any) {
    setEditingPartner(partner);
    setFormData({
      name_ar: partner.name_ar || "",
      name_en: partner.name_en || "",
      description_ar: partner.description_ar || "",
      description_en: partner.description_en || "",
      website: partner.website || "",
      image: partner.image || "",
      display_order: partner.display_order || 0,
    });
    setShowDialog(true);
  }

  // ✅ Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingPartner
        ? `/business-info/${businessInfo._id}/partners/${editingPartner._id}`
        : `/business-info/${businessInfo._id}/partners`;
      const method = editingPartner ? "put" : "post";

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

  // ✅ Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (partnerId: string) =>
      axiosInstance.delete(
        `/business-info/${businessInfo._id}/partners/${partnerId}`
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

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
        options: { folder: "business/partners", prefix: "partner" },
      });

      setFormData((prev) => ({ ...prev, image: url }));
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
    if (!formData.name_ar || !formData.name_en) {
      toast.error(intl.formatMessage({ id: "business_info.name_required" }));
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

  return (
    <div className="space-y-6">
      <SectionCard
        title={intl.formatMessage({ id: "business_info.partners" })}
        headerAction={
          <Button onClick={handleAdd} size="sm" className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.add_partner" })}
          </Button>
        }
      >
        {partners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{intl.formatMessage({ id: "business_info.no_partners" })}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((partner: any) => (
                <div
                  key={partner._id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col h-full">
                    {/* Partner Logo */}
                    <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mb-3 border">
                      {partner.image ? (
                        <img
                          src={partner.image}
                          alt={partner.name_en}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Building2 className="w-12 h-12 text-gray-300" />
                      )}
                    </div>

                    {/* Partner Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {intl.locale === "ar"
                          ? partner.name_ar
                          : partner.name_en}
                      </h3>

                      {partner.description_ar || partner.description_en ? (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {intl.locale === "ar"
                            ? partner.description_ar
                            : partner.description_en}
                        </p>
                      ) : null}

                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-3"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {intl.formatMessage({
                            id: "business_info.visit_website",
                          })}
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(partner)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {intl.formatMessage({ id: "business_info.edit" })}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                          onClick={() => deleteConfirm.showConfirm(partner._id)}
               
                        disabled={deleteMutation.isPending}
                         className="text-white flex-1"
                       
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {intl.formatMessage({ id: "business_info.delete" })}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner
                ? intl.formatMessage({ id: "business_info.edit_partner" })
                : intl.formatMessage({ id: "business_info.add_partner" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Partner Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_ar">
                  {intl.formatMessage({ id: "business_info.name_ar" })} *
                </Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="شركة الشريك"
                />
              </div>

              <div>
                <Label htmlFor="name_en">
                  {intl.formatMessage({ id: "business_info.name_en" })} *
                </Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, name_en: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="Partner Company"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">
                {intl.formatMessage({ id: "business_info.website" })}
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                disabled={isSaving}
                placeholder="https://partner.com"
              />
            </div>

            {/* Partner Image */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">
                {intl.formatMessage({ id: "business_info.partner_logo" })}
              </Label>

              {formData.image && (
                <div className="mb-3 w-full h-32 bg-white rounded border flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block">
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
                        {intl.formatMessage({ id: "business_info.uploading" })}
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

                <Input
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  disabled={isSaving || isUploading}
                  placeholder="Or paste image URL"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description_ar">
                  {intl.formatMessage({ id: "business_info.description_ar" })}
                </Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                  disabled={isSaving}
                  rows={3}
                  dir="rtl"
                  placeholder="وصف الشريك..."
                />
              </div>

              <div>
                <Label htmlFor="description_en">
                  {intl.formatMessage({ id: "business_info.description_en" })}
                </Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                  disabled={isSaving}
                  rows={3}
                  placeholder="Partner description..."
                />
              </div>
            </div>

            {/* Display Order */}
            <div>
              <Label htmlFor="display_order">
                {intl.formatMessage({ id: "business_info.display_order" })}
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSaving || isUploading}
              >
                {intl.formatMessage({ id: "business_info.cancel" })}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading} className="text-white">
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