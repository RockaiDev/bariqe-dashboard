
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Address } from "@/shared/types/profile";
import { addressSchema, AddressSchema } from "@/lib/validations/profile";
import { Loader2 } from "lucide-react";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressSchema) => void;
  initialData?: Address | null;
  isSubmitting: boolean;
}

const AddressModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }: AddressModalProps) => {
  const t = useTranslations("profile.addresses.form");
  const common = useTranslations("common");

  const form = useForm<AddressSchema>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      label: "Home",
      fullName: "",
      city: "",
      region: "",
      street: "",
      phone: "",
      // Optional fields
      neighborhood: "",
      building: "",
      postalCode: "",
      isDefault: false
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({
                label: initialData.label,
                fullName: initialData.fullName || "",
                city: initialData.city,
                region: initialData.region || "",
                street: initialData.street,
                phone: initialData.phone,
                
                postalCode: initialData.postalCode || "",
                neighborhood: initialData.neighborhood || "",
                building: initialData.building || "",
                isDefault: initialData.isDefault
            });
        } else {
            form.reset({
                label: "Home",
                fullName: "",
                city: "",
                region: "",
                street: "",
                phone: "",
                
                postalCode: "",
                neighborhood: "",
                building: "",
                isDefault: false
            });
        }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: AddressSchema) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? t("save") : t("save")}</DialogTitle> 
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("label")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("fullName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
            
             <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl>
                          <Input placeholder={t("phone")} {...field} type="tel" />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("region")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("region")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("city")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("city")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("neighborhood")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("neighborhood")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("street")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("street")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("building")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("building")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("postalCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("postalCode")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-[#004e6e] text-white hover:bg-[#003b53]" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressModal;
