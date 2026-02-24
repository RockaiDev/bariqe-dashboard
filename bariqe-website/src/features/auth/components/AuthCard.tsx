import { cn } from "@/lib/utils";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import Image from "next/image";
import FadeUpReval from "@/shared/animations/FadUpReval";
import { useLocale } from "next-intl";

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  showLogo?: boolean;
  headerContent?: React.ReactNode;
}

const AuthCard = ({
  children,
  title,
  description,
  className,
  showLogo = true,
  headerContent,
}: AuthCardProps) => {
  const locale = useLocale();
    const en_logo = "/en_logo.svg";
  const ar_logo = "/logo.svg";

  return (
    <FadeUpReval className="w-full max-w-[500px]" delay={0.1}>
      <Card className={cn("w-full border-none shadow-none bg-transparent md:bg-white md:shadow-xl backdrop-blur-sm", className)}>
        <CardHeader className="flex flex-col items-center text-center space-y-2 pb-6">
          {showLogo && (
            <div className="mb-4 relative h-auto w-auto">
               {/* Placeholder for logo - assuming one exists or using text if not */}
               {/* We can use the text from the Screenshots "Bariqe Al-Tamyoz Co" */}
               <div className="flex flex-col items-center gap-2">
                  {/* <img src="/logo.png" alt="Logo" className="h-10" /> */}
                  <Image src={locale === "ar" ? ar_logo : en_logo} alt="Logo" width={250} height={250} />
               </div>
            </div>
          )}
          {headerContent}
          {title && <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>}
          {description && <CardDescription className="text-base text-gray-500">{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </FadeUpReval>
  );
};

export default AuthCard;

