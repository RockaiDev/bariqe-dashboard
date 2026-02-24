"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordSchema } from "@/lib/validations/auth";
import { useResetPassword } from "@/shared/hooks/useAuth";
import AuthCard from "@/features/auth/components/AuthCard";
import SecurityIcons from "@/features/auth/components/SecurityIcons";
import PasswordInput from "@/features/auth/components/PasswordInput";
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
import { useSearchParams } from "next/navigation";

const ResetPasswordPage = () => {
  const t = useTranslations("auth.resetPassword");
  const common = useTranslations("auth.common");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const urlOtp = searchParams.get("otp") || ""; // Rename to urlOtp to avoid conflict/confusion

  const { mutate: resetPassword, isPending } = useResetPassword();

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: urlOtp, // Pre-fill if available
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordSchema) => {
  
    resetPassword({
        email,
        otp: data.otp, 
        password: data.password,
        confirmPassword: data.confirmPassword
    });
  };

  return (
    <AuthCard
      title={t("title")}
      description={t("subtitle")}
      showLogo={false}
      headerContent={<SecurityIcons />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OTP Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter 6-digit code" {...field} />
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
                <FormLabel>{t("newPasswordLabel")}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder={t("newPasswordPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder={t("confirmPasswordPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white mt-4" disabled={isPending}>
            {isPending ? common("loading") : t("submit")}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
