
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { updateProfileSchema, UpdateProfileSchema } from "@/lib/validations/profile";
import { useProfile, useUpdateProfile } from "@/shared/hooks/useProfile";
import { useLogout } from "@/shared/hooks/useAuth";
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
import PasswordInput from "@/features/auth/components/PasswordInput";
import { Loader2, LogOut } from "lucide-react";

const PersonalInfoSection = () => {
  const t = useTranslations("profile.personalInfo");
  const tProfile = useTranslations("profile");
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile?.customerName || "",
      email: profile?.customerEmail || "",
      phone: profile?.customerPhone || "",
      currentPassword: "",
      password: "",
    },
    values: { // Update form values when profile data loads
       name: profile?.customerName || "",
       email: profile?.customerEmail || "",
       phone: profile?.customerPhone || "",
       currentPassword: "",
       password: "",
    }
  });

  const onSubmit = (data: UpdateProfileSchema) => {
    // If password is empty, don't send it or handle it in backend
    const submitData = { ...data };
    if (!submitData.password) {
      delete submitData.password;
    }
    if (!submitData.currentPassword) {
      delete submitData.currentPassword;
    }
    updateProfile(submitData);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className=" p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-6 text-primary">{t("title")}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("email")} {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
{profile?.customerSource === 'local' && (
  <>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>{t("changePassword")}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder={t("currentPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput placeholder={t("newPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
            </>
)}

          <div className="pt-4 space-y-4">
            <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("update")}...
                </>
              ) : (
                t("update")
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => logout()}
              disabled={isLogoutPending}
            >
              {isLogoutPending ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                 <LogOut className="mr-2 h-4 w-4" />
              )}
              {tProfile("logout")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonalInfoSection;

