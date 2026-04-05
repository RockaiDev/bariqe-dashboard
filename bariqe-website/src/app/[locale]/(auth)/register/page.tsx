"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterSchema, RegisterSchema } from "@/lib/validations/auth";
import { useRegister, useGoogleLogin, useAppleLogin } from "@/shared/hooks/useAuth";
import AuthCard from "@/features/auth/components/AuthCard";
import PasswordInput from "@/features/auth/components/PasswordInput";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";
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

const RegisterPage = () => {
  const t = useTranslations("auth.register");
  const common = useTranslations("auth.common");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { mutate: register, isPending } = useRegister();
  const { mutate: googleLogin } = useGoogleLogin();
  const { mutate: appleLogin } = useAppleLogin();

  const tValidation = useTranslations("auth.validation");

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(getRegisterSchema(tValidation)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterSchema) => {
    const res = register(data);
    console.log(res)
  };

  return (
    <AuthCard
      title={t("title")}
      // description={t("subtitle")}
      // headerContent={
      //   <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-2">
      //       {t("discountOffer")}
      //   </div>
      // }
      showLogo={true}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} {...field} />
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
                <FormLabel>{t("passwordLabel")}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder={t("passwordPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white mt-2" disabled={isPending}>
            {isPending ? common("loading") : t("submit")}
            {!isPending && (isRtl ? <ChevronLeft className="mr-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />)}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-muted-foreground bg-white">
                {t("or")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <GoogleAuthButton
              text={t("googleRegister")}
              onClick={() => googleLogin(undefined)}
            />
            
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4 hover:text-[#004e6e]">
              {t("loginNow")}
            </Link>
          </div>
        </form>
      </Form>
    </AuthCard>
  );
};

export default RegisterPage;
