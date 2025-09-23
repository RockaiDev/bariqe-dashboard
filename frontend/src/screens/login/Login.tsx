import { useState} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useIntl } from "react-intl";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import loginTopImage from "@/assets/loginTop.svg";
import loginBottomImage from "@/assets/loginBottom.svg";
import logo from "@/assets/logo.svg";
import { Eye, EyeClosed } from "lucide-react";
import { useLogin } from "@/hooks/useLogin";
import { LanguageSelector } from "@/components/shared/LanguageSelector";

// تعريف schema للتحقق من البيانات
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const intl = useIntl();
  const [showPassword, setShowPassword] = useState(false);

  // استخدام react-hook-form مع zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    mutate: login,
    isPending,
    error: loginError,
  } = useLogin({
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
      {/* ========= LEFT SIDE ========= */}
      <div className="relative flex flex-col justify-center w-[941px] h-full bg-[#0a1a3a] text-white p-12 overflow-hidden">
        {/* الصور ديكور */}
      <div className={`absolute ${intl.locale === "ar" ? "right-4" : "left-4"} top-4 left-4 w-full h-full z-50`}>
          <LanguageSelector/>
      </div>
        <img
          src={loginTopImage}
          alt="top decoration"
          className="absolute top-0 left-0 w-[941px] h-[727px] object-cover"
          style={{ aspectRatio: "299/231" }}
        />
        <img
          src={loginBottomImage}
          alt="bottom decoration"
          className="absolute bottom-0 left-0 w-[941px] h-[727px] object-cover"
          style={{ aspectRatio: "299/231" }}
        />

        {/* النصوص */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-[42px] font-bold mb-4 leading-[57.6px]">
            {intl.formatMessage({ id: "Welcome back! Log in to pick up where you left off" })}
          </h1>
          <p className="text-[#ffff]/50 text-[18px]">
            {intl.formatMessage({ id: "Sign in to continue managing the full AlexChem ecosystem — from\n            updating product details and processing orders to tracking\n            consultations and material requests, all in one secure place." })}
          </p>
        </div>
      </div>

      {/* ========= RIGHT SIDE ========= */}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-4 sm:p-6 md:p-8">
        <div className="flex flex-col items-center w-full max-w-md">
          {/* اللوجو فوق الكارد */}
          <img src={logo} alt="logo" className="w-[259px] h-auto mb-12 md:mb-20" />

          {/* الكارد في النص */}
          <Card className="w-full max-w-[404px] flex flex-col items-center justify-center shadow-md border-none sm:border sm:shadow-lg">
            <CardHeader className="flex flex-col items-start gap-1 pb-2 w-full px-8 pt-8">
              <CardTitle className="text-[24px] font-bold">
                {intl.formatMessage({ id: "Welcome back!" })}
              </CardTitle>
              <p className="text-[16px] text-gray-500">{intl.formatMessage({ id: "Sign In to Get Started" })}</p>
            </CardHeader>
            <CardContent className="w-full px-8 pb-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-full"
              >
                <div className="flex gap-1 flex-col w-full">
                  <Label htmlFor="email" className="text-[14px]">
                    {intl.formatMessage({ id: "Email Address" })}
                  </Label>
                  <Input
                    className={`h-[56px] p-[15px] ${errors.email ? 'border-red-500' : ''}`}
                    id="email"
                    type="email"
                    placeholder={intl.formatMessage({ id: "e.g. ahmed@gmail.com" })}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {intl.formatMessage({ id: errors.email.message })}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-col w-full" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
                  <Label htmlFor="password" className="text-[14px]">
                    {intl.formatMessage({ id: "Password" })}
                  </Label>
                  <div className="h-[56px] relative">
                    <Input
                      className={`h-[56px] p-[15px] flex ${errors.password ? 'border-red-500' : ''}`}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...register("password")}
                    />
                    <span 
                      className={`absolute top-[50%] ${intl.locale === "ar" ? "left-4" : "right-4"} -translate-y-1/2 cursor-pointer`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="text-[#33333384]" />
                      ) : (
                        <EyeClosed className="text-[#33333384]" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {intl.formatMessage({ id: errors.password.message })}
                    </p>
                  )}
                </div>

                {loginError && (
                  <p className="text-red-500 text-sm">
                    {(loginError as any)?.result?.message || intl.formatMessage({ id: "Invalid credentials" })}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-white cursor-pointer w-full rounded-[30px] mt-5 font-bold"
                >
                  {isPending ? intl.formatMessage({ id: "Logging in..." }) : intl.formatMessage({ id: "Login" })}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}