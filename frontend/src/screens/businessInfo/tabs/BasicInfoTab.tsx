import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";
import { 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Upload, 
  Loader2,
  Image as ImageIcon 
} from "lucide-react";
import SectionCard from "../SectionCard";
import { useImageUpload } from "@/hooks/useImageUpload";

interface BasicInfoTabProps {
  businessInfo: any;
  onUpdate: () => void;
}

export default function BasicInfoTab({
  businessInfo,
  onUpdate,
}: BasicInfoTabProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();
  
  const [formData, setFormData] = useState({
    logo: "",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    email: "",
    phone: "",
    whatsapp: "",
    facebook: "",
    address_ar: "",
    address_en: "",
  });

  useEffect(() => {
    if (businessInfo) {
      setFormData({
        logo: businessInfo.logo || "",
        title_ar: businessInfo.title_ar || "",
        title_en: businessInfo.title_en || "",
        description_ar: businessInfo.description_ar || "",
        description_en: businessInfo.description_en || "",
        email: businessInfo.email || "",
        phone: businessInfo.phone || "",
        whatsapp: businessInfo.whatsapp || "",
        facebook: businessInfo.facebook || "",
        address_ar: businessInfo.address_ar || "",
        address_en: businessInfo.address_en || "",
      });
    }
  }, [businessInfo]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = businessInfo?._id
        ? `/business-info/${businessInfo._id}`
        : "/business-info";
      const method = businessInfo?._id ? "put" : "post";

      return axiosInstance[method](endpoint, data);
    },
    onSuccess: () => {
      toast.success(
        intl.formatMessage({ id: "business_info.saved_successfully" })
      );
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.save_failed" })
      );
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        options: { folder: "business/logos", prefix: "logo" },
      });

      setFormData((prev) => ({ ...prev, logo: url }));
    } finally {
      e.target.value = "";
    }
  }

  function handleSave() {
    if (!formData.title_ar || !formData.title_en) {
      toast.error(intl.formatMessage({ id: "business_info.title_required" }));
      return;
    }

    saveMutation.mutate(formData);
  }

  const isSaving = saveMutation.isPending;
  const isUploading = uploadImage.isPending;

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      {/* <SectionCard
        title={intl.formatMessage({ id: "business_info.logo" })}
        description={intl.formatMessage({ id: "business_info.logo_desc" })}
      >
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-center gap-6">
      
            <div className="w-32 h-32 rounded-lg bg-white border-2 overflow-hidden flex items-center justify-center flex-shrink-0">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-gray-300" />
              )}
            </div>

     
            <div className="flex-1 space-y-3">
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
                          id: "business_info.upload_logo",
                        })}
                      </>
                    )}
                  </Button>
                </label>

                {formData.logo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, logo: "" })}
                    disabled={isSaving || isUploading}
                  >
                    {intl.formatMessage({ id: "business_info.remove" })}
                  </Button>
                )}
              </div>

              <Input
                value={formData.logo}
                onChange={(e) =>
                  setFormData({ ...formData, logo: e.target.value })
                }
                disabled={isSaving || isUploading}
                placeholder={intl.formatMessage({
                  id: "business_info.or_paste_image_url",
                })}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </SectionCard> */}

      {/* Basic Information */}
      <SectionCard
        title={intl.formatMessage({ id: "business_info.basic_information" })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title_ar">
              {intl.formatMessage({ id: "business_info.title_ar" })} *
            </Label>
            <Input
              id="title_ar"
              name="title_ar"
              value={formData.title_ar}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_title_ar",
              })}
              disabled={isSaving}
              dir="rtl"
            />
          </div>

          <div>
            <Label htmlFor="title_en">
              {intl.formatMessage({ id: "business_info.title_en" })} *
            </Label>
            <Input
              id="title_en"
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_title_en",
              })}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="description_ar">
              {intl.formatMessage({ id: "business_info.description_ar" })}
            </Label>
            <Textarea
              id="description_ar"
              name="description_ar"
              value={formData.description_ar}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_description_ar",
              })}
              disabled={isSaving}
              rows={4}
              dir="rtl"
            />
          </div>

          <div>
            <Label htmlFor="description_en">
              {intl.formatMessage({ id: "business_info.description_en" })}
            </Label>
            <Textarea
              id="description_en"
              name="description_en"
              value={formData.description_en}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_description_en",
              })}
              disabled={isSaving}
              rows={4}
            />
          </div>
        </div>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard
        title={intl.formatMessage({ id: "business_info.contact_information" })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.email" })}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@company.com"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.phone" })}
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+20 123 456 7890"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="whatsapp">
              <Phone className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.whatsapp" })}
            </Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+20 123 456 7890"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="facebook">
              <Globe className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.facebook" })}
            </Label>
            <Input
              id="facebook"
              name="facebook"
              type="url"
              value={formData.facebook}
              onChange={handleChange}
              placeholder="https://www.company.com"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="address_ar">
              <MapPin className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.address_ar" })}
            </Label>
            <Textarea
              id="address_ar"
              name="address_ar"
              value={formData.address_ar}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_address_ar",
              })}
              disabled={isSaving}
              rows={2}
              dir="rtl"
            />
          </div>

          <div>
            <Label htmlFor="address_en">
              <MapPin className="w-4 h-4 inline mr-2" />
              {intl.formatMessage({ id: "business_info.address_en" })}
            </Label>
            <Textarea
              id="address_en"
              name="address_en"
              value={formData.address_en}
              onChange={handleChange}
              placeholder={intl.formatMessage({
                id: "business_info.enter_address_en",
              })}
              disabled={isSaving}
              rows={2}
            />
          </div>
        </div>
      </SectionCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isUploading || !formData.title_ar || !formData.title_en}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {isSaving || isUploading ? (
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
  );
}