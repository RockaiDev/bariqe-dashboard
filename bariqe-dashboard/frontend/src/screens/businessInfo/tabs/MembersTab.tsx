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
  User,
  Mail,
  Phone,
  Linkedin,
  Star,
  Upload,
  Loader2,
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface MembersTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function MembersTab({ businessInfo, onUpdate }: MembersTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();
  const [showDialog, setShowDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    position_ar: "",
    position_en: "",
    bio_ar: "",
    bio_en: "",
    email: "",
    phone: "",
    linkedin: "",
    image: "",
    is_leadership: false,
    display_order: 0,
  });

  const members = businessInfo?.members || [];

  function handleAdd() {
    setEditingMember(null);
    setFormData({
      name_ar: "",
      name_en: "",
      position_ar: "",
      position_en: "",
      bio_ar: "",
      bio_en: "",
      email: "",
      phone: "",
      linkedin: "",
      image: "",
      is_leadership: false,
      display_order: members.length,
    });
    setShowDialog(true);
  }

  function handleEdit(member: any) {
    setEditingMember(member);
    setFormData({
      name_ar: member.name_ar || "",
      name_en: member.name_en || "",
      position_ar: member.position_ar || "",
      position_en: member.position_en || "",
      bio_ar: member.bio_ar || "",
      bio_en: member.bio_en || "",
      email: member.email || "",
      phone: member.phone || "",
      linkedin: member.linkedin || "",
      image: member.image || "",
      is_leadership: member.is_leadership || false,
      display_order: member.display_order || 0,
    });
    setShowDialog(true);
  }

  // ✅ Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingMember
        ? `/business-info/${businessInfo._id}/members/${editingMember._id}`
        : `/business-info/${businessInfo._id}/members`;
      const method = editingMember ? "put" : "post";

      return axiosInstance[method](endpoint, data);
    },
    onSuccess: () => {
      toast.success(intl.formatMessage({ id: "business_info.saved_successfully" }));
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
    mutationFn: (memberId: string) =>
      axiosInstance.delete(`/business-info/${businessInfo._id}/members/${memberId}`),
    onSuccess: () => {
      toast.success(intl.formatMessage({ id: "business_info.deleted_successfully" }));
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
      toast.error(intl.formatMessage({ id: "business_info.invalid_file_type" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(intl.formatMessage({ id: "business_info.file_too_large" }));
      return;
    }

    try {
      const url = await uploadImage.mutateAsync({
        file,
        options: { folder: "business/members", prefix: "member" },
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
      toast.error(intl.formatMessage({ id: "business_info.create_business_first" }));
      return;
    }

    saveMutation.mutate(formData);
  }



  const isSaving = saveMutation.isPending;
  const isUploading = uploadImage.isPending;

  return (
    <div className="space-y-6">
      <SectionCard
        title={intl.formatMessage({ id: "business_info.team_members" })}
        headerAction={
          <Button onClick={handleAdd} size="sm" className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.add_member" })}
          </Button>
        }
      >
        {members.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{intl.formatMessage({ id: "business_info.no_members" })}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((member: any) => (
                <div
                  key={member._id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {intl.locale === "ar" ? member.name_ar : member.name_en}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {intl.locale === "ar"
                              ? member.position_ar
                              : member.position_en}
                          </p>
                        </div>
                        {member.is_leadership && (
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {member.email && (
                          <div className="flex items-center text-xs text-gray-500 truncate">
                            <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                            {member.phone}
                          </div>
                        )}
                        {member.linkedin && (
                          <div className="flex items-center text-xs text-blue-600">
                            <Linkedin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline truncate"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {intl.formatMessage({ id: "business_info.edit" })}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                     
                            onClick={() => deleteConfirm.showConfirm(member._id)}
                           className="text-white"
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember
                ? intl.formatMessage({ id: "business_info.edit_member" })
                : intl.formatMessage({ id: "business_info.add_member" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">
                {intl.formatMessage({ id: "business_info.member_image" })}
              </Label>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
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
                            {intl.formatMessage({ id: "business_info.uploading" })}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {intl.formatMessage({ id: "business_info.upload_image" })}
                          </>
                        )}
                      </Button>
                    </label>

                    {formData.image && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        disabled={isSaving || isUploading}
                      >
                        {intl.formatMessage({ id: "business_info.remove" })}
                      </Button>
                    )}
                  </div>

                  <FormField
                    id="member-image-url"
                    label=""
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="name_ar"
                label={intl.formatMessage({ id: "business_info.name_ar" })}
                value={formData.name_ar}
                onChange={(e:any) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                disabled={isSaving}
                required
                dir="rtl"
              />

              <FormField
                id="name_en"
                label={intl.formatMessage({ id: "business_info.name_en" })}
                value={formData.name_en}
                onChange={(e:any) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                disabled={isSaving}
                required
              />

              <FormField
                id="position_ar"
                label={intl.formatMessage({ id: "business_info.position_ar" })}
                value={formData.position_ar}
                onChange={(e:any) =>
                  setFormData({ ...formData, position_ar: e.target.value })
                }
                disabled={isSaving}
                dir="rtl"
              />

              <FormField
                id="position_en"
                label={intl.formatMessage({ id: "business_info.position_en" })}
                value={formData.position_en}
                onChange={(e:any) =>
                  setFormData({ ...formData, position_en: e.target.value })
                }
                disabled={isSaving}
              />

              <FormField
                id="email"
                label={intl.formatMessage({ id: "business_info.email" })}
                type="email"
                value={formData.email}
                onChange={(e:any) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isSaving}
              />

              <FormField
                id="phone"
                label={intl.formatMessage({ id: "business_info.phone" })}
                variant="phone"
                onChange={(e:any) => {e;}}
                value={formData.phone}
                onPhoneChange={(value:any) =>
                  setFormData({ ...formData, phone: value || "" })
                }
                disabled={isSaving}
              />

              <FormField
                id="linkedin"
                label={intl.formatMessage({ id: "business_info.linkedin" })}
                type="url"
                value={formData.linkedin}
                onChange={(e:any) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                disabled={isSaving}
                placeholder="https://linkedin.com/in/username"
              />

              <FormField
                id="display_order"
                label={intl.formatMessage({ id: "business_info.display_order" })}
                type="number"
                value={formData.display_order}
                onChange={(e:any) =>
                  setFormData({
                    ...formData,
                    display_order: Number(e.target.value),
                  })
                }
                disabled={isSaving}
              />

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_leadership"
                  checked={formData.is_leadership}
                  onChange={(e:any) =>
                    setFormData({
                      ...formData,
                      is_leadership: e.target.checked,
                    })
                  }
                  disabled={isSaving}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_leadership" className="cursor-pointer">
                  {intl.formatMessage({ id: "business_info.is_leadership" })}
                </Label>
              </div>
            </div>

            <FormField
              id="bio_ar"
              label={intl.formatMessage({ id: "business_info.bio_ar" })}
              variant="textarea"
              value={formData.bio_ar}
              onChange={(e:any) =>
                setFormData({ ...formData, bio_ar: e.target.value })
              }
              disabled={isSaving}
              rows={3}
              dir="rtl"
            />

            <FormField
              id="bio_en"
              label={intl.formatMessage({ id: "business_info.bio_en" })}
              variant="textarea"
              value={formData.bio_en}
              onChange={(e:any) =>
                setFormData({ ...formData, bio_en: e.target.value })
              }
              disabled={isSaving}
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSaving || isUploading}
              >
                {intl.formatMessage({ id: "business_info.cancel" })}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading}  className="text-white">
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