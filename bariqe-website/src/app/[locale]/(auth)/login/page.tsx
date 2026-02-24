"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginSchema } from "@/lib/validations/auth";
import { useLogin, useGoogleLogin, useAppleLogin } from "@/shared/hooks/useAuth";
import AuthCard from "@/features/auth/components/AuthCard";
import PasswordInput from "@/features/auth/components/PasswordInput";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";
import AppleAuthButton from "@/features/auth/components/AppleAuthButton";
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
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";

const LoginPage = () => {
  const t = useTranslations("auth.login");
  const common = useTranslations("auth.common");
  const locale = useLocale();
  const isRtl = locale === "ar";
  
  const { mutate: login, isPending } = useLogin();
  const { mutate: googleLogin } = useGoogleLogin();
  const { mutate: appleLogin } = useAppleLogin();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginSchema) => {
    login(data);
  };

  return (
    <AuthCard
      title={t("title")}
      description={t("subtitle")}
      showLogo={true}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("emailLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("emailPlaceholder")} {...field} />
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
                <div className="flex items-center justify-between">
                  <FormLabel>{t("passwordLabel")}</FormLabel>
                </div>
                <FormControl>
                  <PasswordInput placeholder={t("passwordPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
             <Link
                href="/forgot-password"
                className="text-sm font-medium text-gray-500 hover:text-primary underline underline-offset-4"
              >
                {t("forgotPassword")}
              </Link>
          </div>

          <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white" disabled={isPending}>
            {isPending ? common("loading") : t("submit")}
            {!isPending && (isRtl ? <ChevronLeft className="mr-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />)}
          </Button>
          
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-muted-foreground ">
                {t("or")}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <GoogleAuthButton 
              text={t("googleLogin")} 
              onClick={() => googleLogin(undefined)}
            />
            <AppleAuthButton 
              text={t("appleLogin")} 
              onClick={() => appleLogin()}
            />
          </div>

          <div className="text-center text-sm text-gray-500">
             {t("noAccount")}{" "}
            <Link href="/register" className="font-semibold text-primary underline underline-offset-4 hover:text-[#004e6e]">
              {t("registerNow")}
            </Link>
          </div>
        </form>
      </Form>
    </AuthCard>
  );
};

export default LoginPage;
