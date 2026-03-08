"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getForgotPasswordSchema, ForgotPasswordSchema } from "@/lib/validations/auth";
import { useForgotPassword } from "@/shared/hooks/useAuth";
import AuthCard from "@/features/auth/components/AuthCard";
import SecurityIcons from "@/features/auth/components/SecurityIcons";
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
import { useRouter } from "@/i18n/routing";

const ForgotPasswordPage = () => {
  const t = useTranslations("auth.forgotPassword");
  const common = useTranslations("auth.common");
  const router = useRouter();

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const tValidation = useTranslations("auth.validation");

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(getForgotPasswordSchema(tValidation)),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordSchema) => {
    forgotPassword(data);
  };

  return (
    <AuthCard
      title={t("title")}
      description={t("subtitle")}
      showLogo={false}
      headerContent={<SecurityIcons />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center text-sm text-gray-500 mb-4">
            {t("instruction")}
          </div>

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

          <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white" disabled={isPending}>
            {isPending ? common("loading") : t("submit")}
          </Button>

          {/* <div className="text-center mt-4">
                <button type="button" className="text-sm text-gray-500 hover:text-primary underline">
                    {t("usePhoneInstead")}
                </button>
           </div> */}
        </form>
      </Form>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
