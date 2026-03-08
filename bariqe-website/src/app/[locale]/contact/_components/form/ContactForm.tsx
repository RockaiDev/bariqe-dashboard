"use client";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { LocationSelector } from "@/shared/components/LocationSelector";
import { publicApiService } from "@/lib/publicApiService";
import { LocationData } from "@/shared/types/location";
import {
  Send,
  Loader2,
  User,
  MapPin,
  FileText,
  MessageSquare,
  ChevronDown,
  X,
} from "lucide-react";
import { CustomPhoneInput } from "@/shared/components/phone-input";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";
import CustomBreadcrumb from "@/shared/components/CustomBreadcrumb";
import { useProfile } from "@/shared/hooks/useProfile";

interface FormData {
  contactName: string;
  email: string;
  phoneNumber: string;
  message: string;

}

const initialFormData: FormData = {
  contactName: "",
  email: "",
  phoneNumber: "",
  message: "",

};

const initialLocationData: LocationData = {
  country: "",
  state: "",
  city: "",
  countryCode: "",
  stateCode: "",
};

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const { data: userProfile } = useProfile();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationData, setLocationData] =
    useState<LocationData>(initialLocationData);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        contactName: prev.contactName || userProfile.customerName || "",
        email: prev.email || userProfile.customerEmail || "",
        phoneNumber: prev.phoneNumber || userProfile.customerPhone || "",
      }));
    }
  }, [userProfile]);

  // Services Dropdown State
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    handleInputChange("phoneNumber", value || "");
  };




  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.contactName.trim()) {
      newErrors.contactName = t("validation.nameRequired");
    } else if (formData.contactName.trim().length < 2) {
      newErrors.contactName = t("validation.nameMinLength");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t("validation.phoneRequired");
    } else if (formData.phoneNumber.replace(/\D/g, "").length < 10) {
      newErrors.phoneNumber = t("validation.phoneMinLength");
    }


    if (!formData.message.trim()) {
      newErrors.message = t("validation.messageRequired");
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t("validation.messageMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(userProfile ? {
      ...initialFormData,
      contactName: userProfile.customerName || "",
      email: userProfile.customerEmail || "",
      phoneNumber: userProfile.customerPhone || "",
    } : initialFormData);
    setErrors({});
    setLocationData(initialLocationData);
    setSubmitSuccess(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error(t("messages.fillRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);
      setErrors({});


      // let customerId: string;
      // "Fields 'customerName', 'customerPhone', 'customerSource' and 'customerAddress' are required"
      // try {
      //   const customerData = {
      //     customerName: formData.contactName.trim(),
      //     customerPhone: formData.phoneNumber.trim(),
      //     customerEmail: formData.email.trim().toLowerCase(),
      //     customerSource:'other',
      //     customerAddress:'test address'



      //   };

      //   console.log("Creating customer with data:", customerData);
      //   const customerResponse: any = await publicApiService.createCustomer(
      //     customerData
      //   );
      // console.log("Customer created successfully:", customerResponse);

      // customerId = customerResponse?.result?._id || customerResponse?._id;

      // if (!customerId) {
      //   toast.error(t("messages.customerError"));
      //   return;
      // }

      // console.log("Customer created with ID:", customerId);
      // } catch (customerError: any) {
      // console.log("Customer creation error:", customerError);

      //   const errorMessage =
      //     customerError?.response?.data?.message ||
      //     customerError?.data?.result?.message ||
      //     customerError?.message ||
      //     t("messages.customerError");

      //   if (errorMessage.includes("phone") && errorMessage.includes("exists")) {
      //     setErrors({ phoneNumber: t("messages.phoneExists") });
      //     toast.error(t("messages.phoneExists"));
      //   } else if (
      //     errorMessage.includes("email") &&
      //     errorMessage.includes("exists")
      //   ) {
      //     setErrors({ email: t("messages.emailExists") });
      //     toast.error(t("messages.emailExists"));
      //   } else {
      //     toast.error(errorMessage);
      //   }
      //   return;
      // }

      try {
        const contactData = {

          contactName: formData.contactName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          // address:'test test test',
          message: formData.message.trim(),

        };

        // console.log("Creating contact with data:", contactData);
        await publicApiService.createContact(contactData);
        // console.log("Contact created successfully");

        setSubmitSuccess(true);
        toast.success(t("messages.success"), {
          duration: 5000,
          icon: "✅",
        });

        setTimeout(() => {
          resetForm();
        }, 2000);
      } catch (contactError: any) {
        // console.log("Contact creation error:", contactError);
        const errorMessage =
          contactError?.response?.data?.message ||
          contactError?.data?.result?.message ||
          contactError?.message ||
          t("messages.contactError");
        toast.error(errorMessage);
        return;
      }
    } catch (error: any) {
      // console.log("General error:", error);
      toast.error(error?.message || t("messages.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">



      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-primary flex items-center text-lg">

            {t("contactInfo")}
          </h4>

          {/* Full Name */}
          <div className="space-y-2">

            <Input
              id="contactName"
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={(e) => handleInputChange("contactName", e.target.value)}
              placeholder={t("placeholders.fullName")}
              disabled={isSubmitting}
              className="bg-white py-6"
            />
            {errors.contactName && (
              <p className="text-sm text-red-400">{errors.contactName}</p>
            )}
          </div>

          {/* Email & Phone - Responsive Grid */}

          {/* Email */}
          <div className="space-y-2">

            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder={t("placeholders.email")}
              disabled={isSubmitting}
              className="bg-white py-6"
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">

            <CustomPhoneInput
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder={t("placeholders.phone")}
              disabled={isSubmitting}
              className="bg-white"
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-400">{errors.phoneNumber}</p>
            )}
          </div>


        </div>






        {/* Message Section */}
        <div className="space-y-3">


          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            placeholder={t("placeholders.message")}
            rows={15}
            disabled={isSubmitting}
            className="bg-white resize-none h-40"
          />
          {errors.message && (
            <p className="text-sm text-red-400">{errors.message}</p>
          )}
          <p className="text-xs text-gray-400">
            {t("helpers.characterCount", { count: formData.message.length })}
          </p>
        </div>


        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white hover:bg-secondary cursor-pointer py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                {t("buttons.submitting")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                {t("buttons.submit")}
              </>
            )}
          </Button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="p-4 rounded-lg bg-green-900/50 border border-green-700 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-green-300">
                  {t("messages.success").split("!")[0]}!
                </h3>
                <p className="mt-1 text-sm text-green-200">
                  {t("messages.success").split("!")[1]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {!submitSuccess && Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-lg bg-red-900/50 border border-red-700 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-300">
                  {t("messages.error").split("!")[0]}!
                </h3>
                <p className="mt-1 text-sm text-red-200">
                  {t("messages.error").split("!")[1]}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
