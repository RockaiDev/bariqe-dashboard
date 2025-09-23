import { useState, type InputHTMLAttributes } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// import { useNavigate } from "react-router-dom";

import loginTopImage from "@/assets/loginTop.svg";
import loginBottomImage from "@/assets/loginBottom.svg";
import logo from "@/assets/logo.svg";
import { Eye, EyeClosed } from "lucide-react";
import { useLogin } from "@/hooks/useLogin";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] =
    useState<InputHTMLAttributes<HTMLInputElement>["type"]>("password");



  // نمرر ال onSuccess hook
  const {
    mutate: login,
    isPending,
    error,
  } = useLogin({
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({ email, password });
  }

  return (
    <div className="flex w-screen  h-screen overflow-hidden">
      {/* ========= LEFT SIDE ========= */}
      <div className="relative flex flex-col justify-center w-[941px] h-full bg-[#0a1a3a] text-white p-12 overflow-hidden">
        {/* الصور ديكور */}
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
            Welcome back! Log in to pick up where you left off
          </h1>
          <p className="text-[#ffff]/50 text-[18px]">
            Sign in to continue managing the full AlexChem ecosystem — from
            updating product details and processing orders to tracking
            consultations and material requests, all in one secure place.
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
                    Welcome back!
                    </CardTitle>
                    <p className="text-[16px] text-gray-500">Sign In to Get Started</p>
                </CardHeader>
                <CardContent className="w-full px-8 pb-8">
                    <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 w-full"
                    >
                    <div className="flex gap-1 flex-col w-full">
                        <Label htmlFor="email" className="text-[14px]">
                        Email Address
                        </Label>
                        <Input
                        className="h-[56px] p-[15px]"
                        id="email"
                        placeholder="e.g. ahmed@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>

                    <div className="flex gap-1 flex-col w-full ">
                        <Label htmlFor="password" className="text-[14px]">
                        Password
                        </Label>
                        <div className="h-[56px] relative">
                        <Input
                            className="h-[56px] p-[15px] flex"
                            id="password"
                            type={type}
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span className="absolute top-[50%] right-4 -translate-y-1/2 cursor-pointer">
                            {type === "password" ? (
                            <EyeClosed
                                className="text-[#33333384]"
                                onClick={() => setType("text")}
                            />
                            ) : (
                            <Eye
                                className="text-[#33333384]"
                                onClick={() => setType("password")}
                            />
                            )}
                        </span>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">
                        {(error as any)?.result?.message || "Invalid credentials"}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-primary text-white cursor-pointer w-full rounded-[30px] mt-5 font-bold"
                    >
                        {isPending ? "Logging in..." : "Login"}
                    </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
