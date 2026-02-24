"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OtpSchema } from "@/lib/validations/auth";
import { useVerifyOTP, useResendOTP } from "@/shared/hooks/useAuth";
import AuthCard from "@/features/auth/components/AuthCard";
import SecurityIcons from "@/features/auth/components/SecurityIcons";
import OTPInput from "@/features/auth/components/OTPInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/ui/form";
import { Button } from "@/shared/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { toast } from "react-hot-toast";

const VerifyOTPPage = () => {
  const t = useTranslations("auth.verifyOtp");
  const common = useTranslations("auth.common");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "reset"; // 'register' or 'reset'
  const router = useRouter();

  const { mutate: verifyOtp, isPending } = useVerifyOTP();
  const { mutate: resendOtp, isPending: isResending } = useResendOTP();

  const form = useForm<OtpSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = (data: OtpSchema) => {
    verifyOtp({ email, otp: data.otp }, {
      onSuccess: (response) => {
        if (type === "register") {
          // Registration verification flow - redirect to login
          toast.success("Email verified successfully! Please log in.");
          router.push("/");
        } else {
          // Password reset flow - redirect to reset password page
          const tokenParam = response.tempToken ? `&token=${response.tempToken}` : "";
          router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${data.otp}${tokenParam}`);
        }
      }
    });
  };

  const handleResendOTP = () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }
    resendOtp({ email });
  };

  return (
    <AuthCard
      title={t("title")}
      showLogo={false}
      headerContent={<SecurityIcons />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <div className="text-center text-sm text-gray-500 -mt-2">
              {t("instruction", { email: email || "your email" })}
          </div>

          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="flex flex-col text-center justify-center">
                <FormControl>
                  <OTPInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-center text-sm">
             {t("didNotReceive")}{" "}
            <button 
              type="button" 
              className="font-bold text-primary hover:text-primary/90 disabled:opacity-50"
              onClick={handleResendOTP}
              disabled={isResending}
            >
                {isResending ? common("loading") : t("resendCode")}
            </button>
          </div>

          <Button type="submit" className="w-full bg-[#004e6e] hover:bg-[#003b53] text-white" disabled={isPending}>
            {isPending ? common("loading") : t("submit")}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};

export default VerifyOTPPage;

