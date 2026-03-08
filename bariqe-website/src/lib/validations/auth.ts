import * as z from "zod";

// Helper for translated error messages (we'll just use keys/defaults for now)
// In a real component, we'd use useTranslations(). But schemas are often defined outside components.
// We will define schemas as functions that accept t function or use simple strings that we might manually handle or use zod-i18n if available.
// For now, let's use standard strings which we can translate in the form components using resolver.

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const getLoginSchema = (t: any) => z.object({
  email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
  password: z.string().min(1, t("passwordRequired")).min(6, t("passwordMinLength")),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const getRegisterSchema = (t: any) => z.object({
  name: z.string().min(1, t("nameRequired")).min(2, t("nameMinLength")),
  email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
  password: z.string().min(1, t("passwordRequired")).min(6, t("passwordMinLength")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const getForgotPasswordSchema = (t: any) => z.object({
  email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
});

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 characters"),
});

export const getOtpSchema = (t: any) => z.object({
  otp: z.string().length(6, t("otpLength")),
});

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const getResetPasswordSchema = (t: any) => z
  .object({
    otp: z.string().length(6, t("otpLength")),
    password: z.string().min(1, t("passwordRequired")).min(6, t("passwordMinLength")),
    confirmPassword: z.string().min(1, t("passwordRequired")).min(6, t("passwordMinLength")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsMismatch"),
    path: ["confirmPassword"],
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type OtpSchema = z.infer<typeof otpSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

