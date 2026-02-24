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
    <div className="flex flex-col lg:flex-row w-screen h-screen overflow-hidden" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
      {/* ========= LEFT SIDE ========= */}
      <div className="relative hidden lg:flex flex-col justify-center lg:w-[60%] xl:w-[55%] 2xl:w-[50%] h-full bg-[#0a1a3a] text-white p-6 lg:p-8 xl:p-12 overflow-hidden">
        {/* Language Selector */}
        <div className={`absolute ${intl.locale === "ar" ? "right-4" : "left-4"} top-4 w-full h-full z-50`}>
          <LanguageSelector/>
        </div>
        
        {/* Background Images */}
        <img
          src={loginTopImage}
          alt="top decoration"
          className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
        />
        <img
          src={loginBottomImage}
          alt="bottom decoration"
          className="absolute bottom-0 left-0 w-full h-full object-cover opacity-80"
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg xl:max-w-xl">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-[42px] font-bold mb-4 leading-tight xl:leading-[57.6px]">
            {intl.formatMessage({ id: "Welcome back! Log in to pick up where you left off" })}
          </h1>
          <p className="text-white/70 text-sm lg:text-base xl:text-lg leading-relaxed">
            {intl.formatMessage({ id: "login_signin_description" })}
          </p>
        </div>
      </div>

      {/* ========= RIGHT SIDE ========= */}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-4 sm:p-6 lg:p-8 min-h-screen lg:min-h-0">
        {/* Language Selector for Mobile */}
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <LanguageSelector/>
        </div>

        <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md">
          {/* Logo */}
          <img 
            src={logo} 
            alt="logo" 
            className="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-[259px] h-auto mb-8 sm:mb-12 lg:mb-16 xl:mb-20" 
          />

          {/* Login Card */}
          <Card className="w-full max-w-[404px] flex flex-col items-center justify-center shadow-none sm:shadow-md border-none sm:border">
            <CardHeader className="flex flex-col items-start gap-1 pb-2 w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {intl.formatMessage({ id: "Welcome back!" })}
              </CardTitle>
              <p className="text-sm sm:text-base text-gray-500">
                {intl.formatMessage({ id: "Sign In to Get Started" })}
              </p>
            </CardHeader>
            
            <CardContent className="w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-full"
              >
                {/* Email Field */}
                <div className="flex gap-1 flex-col w-full">
                  <Label htmlFor="email" className="text-sm">
                    {intl.formatMessage({ id: "Email Address" })}
                  </Label>
                  <Input
                    className={`h-12 sm:h-14 p-3 sm:p-4 text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`}
                    id="email"
                    type="email"
                    placeholder={intl.formatMessage({ id: "e.g. ahmed@gmail.com" })}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {intl.formatMessage({ id: errors.email.message })}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="flex gap-1 flex-col w-full" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
                  <Label htmlFor="password" className="text-sm">
                    {intl.formatMessage({ id: "Password" })}
                  </Label>
                  <div className="h-12 sm:h-14 relative">
                    <Input
                      className={`h-12 sm:h-14 p-3 sm:p-4 text-sm sm:text-base flex ${errors.password ? 'border-red-500' : ''}`}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...register("password")}
                    />
                    <span 
                      className={`absolute top-[50%] ${intl.locale === "ar" ? "left-3 sm:left-4" : "right-3 sm:right-4"} -translate-y-1/2 cursor-pointer`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="text-[#33333384] w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <EyeClosed className="text-[#33333384] w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {intl.formatMessage({ id: errors.password.message })}
                    </p>
                  )}
                </div>

                {/* Login Error */}
                {loginError && (
                  <p className="text-red-500 text-xs sm:text-sm">
                    {(loginError as any)?.result?.message || intl.formatMessage({ id: "Invalid credentials" })}
                  </p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-white cursor-pointer w-full rounded-[30px] mt-3 sm:mt-5 font-bold h-10 text-sm sm:text-base"
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