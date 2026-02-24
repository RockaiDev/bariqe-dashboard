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
  MapPin,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface LocationsTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function LocationsTab({
  businessInfo,
  onUpdate,
}: LocationsTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    country_ar: "",
    country_en: "",
    city_ar: "",
    city_en: "",
    address_ar: "",
    address_en: "",
    phone: "",
    email: "",
    map_url: "",
  });

  const locations = businessInfo?.locations || [];

  function handleAdd() {
    setEditingLocation(null);
    setFormData({
      country_ar: "",
      country_en: "",
      city_ar: "",
      city_en: "",
      address_ar: "",
      address_en: "",
      phone: "",
      email: "",
      map_url: "",
    });
    setShowDialog(true);
  }

  function handleEdit(location: any) {
    setEditingLocation(location);
    setFormData({
      country_ar: location.country_ar || "",
      country_en: location.country_en || "",
      city_ar: location.city_ar || "",
      city_en: location.city_en || "",
      address_ar: location.address_ar || "",
      address_en: location.address_en || "",
      phone: location.phone || "",
      email: location.email || "",
      map_url: location.map_url || "",
    });
    setShowDialog(true);
  }

  // ✅ Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingLocation
        ? `/business-info/${businessInfo._id}/locations/${editingLocation._id}`
        : `/business-info/${businessInfo._id}/locations`;
      const method = editingLocation ? "put" : "post";

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
    mutationFn: (locationId: string) =>
      axiosInstance.delete(
        `/business-info/${businessInfo._id}/locations/${locationId}`
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
  

  function handleSave() {
    if (!formData.city_en || !formData.country_en) {
      toast.error(
        intl.formatMessage({ id: "business_info.city_country_required" })
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

  return (
    <div className="space-y-6">
      <SectionCard
        title={intl.formatMessage({ id: "business_info.locations" })}
        headerAction={
          <Button onClick={handleAdd} size="sm" className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: "business_info.add_location" })}
          </Button>
        }
      >
        {locations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{intl.formatMessage({ id: "business_info.no_locations" })}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location: any) => (
              <div
                key={location._id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {intl.locale === "ar"
                        ? `${location.city_ar}, ${location.country_ar}`
                        : `${location.city_en}, ${location.country_en}`}
                    </h3>

                    {location.address_ar || location.address_en ? (
                      <p className="text-sm text-gray-600 mb-2">
                        {intl.locale === "ar"
                          ? location.address_ar
                          : location.address_en}
                      </p>
                    ) : null}

                    <div className="space-y-1">
                      {location.phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>{location.phone}</span>
                        </div>
                      )}

                      {location.email && (
                        <div className="flex items-center text-xs text-gray-500 truncate">
                          <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{location.email}</span>
                        </div>
                      )}

                      {location.map_url && (
                        <a
                          href={location.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mr-2 flex-shrink-0" />
                          {intl.formatMessage({
                            id: "business_info.view_on_map",
                          })}
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {intl.formatMessage({ id: "business_info.edit" })}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                         className="text-white"
                           onClick={() => deleteConfirm.showConfirm(location._id)}
                    
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation
                ? intl.formatMessage({ id: "business_info.edit_location" })
                : intl.formatMessage({ id: "business_info.add_location" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country_ar">
                  {intl.formatMessage({ id: "business_info.country_ar" })}
                </Label>
                <Input
                  id="country_ar"
                  value={formData.country_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, country_ar: e.target.value })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="مصر"
                />
              </div>

              <div>
                <Label htmlFor="country_en">
                  {intl.formatMessage({ id: "business_info.country_en" })} *
                </Label>
                <Input
                  id="country_en"
                  value={formData.country_en}
                  onChange={(e) =>
                    setFormData({ ...formData, country_en: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="Egypt"
                />
              </div>

              <div>
                <Label htmlFor="city_ar">
                  {intl.formatMessage({ id: "business_info.city_ar" })}
                </Label>
                <Input
                  id="city_ar"
                  value={formData.city_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, city_ar: e.target.value })
                  }
                  disabled={isSaving}
                  dir="rtl"
                  placeholder="القاهرة"
                />
              </div>

              <div>
                <Label htmlFor="city_en">
                  {intl.formatMessage({ id: "business_info.city_en" })} *
                </Label>
                <Input
                  id="city_en"
                  value={formData.city_en}
                  onChange={(e) =>
                    setFormData({ ...formData, city_en: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="Cairo"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_ar">
                  {intl.formatMessage({ id: "business_info.address_ar" })}
                </Label>
                <Textarea
                  id="address_ar"
                  value={formData.address_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, address_ar: e.target.value })
                  }
                  disabled={isSaving}
                  rows={2}
                  dir="rtl"
                  placeholder="123 شارع التحرير، وسط البلد"
                />
              </div>

              <div>
                <Label htmlFor="address_en">
                  {intl.formatMessage({ id: "business_info.address_en" })}
                </Label>
                <Textarea
                  id="address_en"
                  value={formData.address_en}
                  onChange={(e) =>
                    setFormData({ ...formData, address_en: e.target.value })
                  }
                  disabled={isSaving}
                  rows={2}
                  placeholder="123 Tahrir Street, Downtown"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  {intl.formatMessage({ id: "business_info.phone" })}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="+20 123 456 7890"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  {intl.formatMessage({ id: "business_info.email" })}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="cairo@company.com"
                />
              </div>
            </div>

            {/* Map URL */}
            <div>
              <Label htmlFor="map_url">
                {intl.formatMessage({ id: "business_info.map_url" })}
              </Label>
              <Input
                id="map_url"
                type="url"
                value={formData.map_url}
                onChange={(e) =>
                  setFormData({ ...formData, map_url: e.target.value })
                }
                disabled={isSaving}
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSaving}
              >
                {intl.formatMessage({ id: "business_info.cancel" })}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}  className="text-white">
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