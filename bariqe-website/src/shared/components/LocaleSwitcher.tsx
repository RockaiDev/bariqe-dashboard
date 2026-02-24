"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from '@/shared/constants/enums';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  isMobile?: boolean;
  className?: string;
}

const languages = [
  {
    code: Languages.ARABIC,
    name: 'AR',
    fullName: 'العربية',
    flag: '🇪🇬'
  },
  {
    code: Languages.ENGLISH,
    name: 'EN',
    fullName: 'English',
    flag: '🇺🇸'
  }
];

export default function LocaleSwitcher({ isMobile = false, className }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  // استخراج اللغة الحالية من المسار
  const getCurrentLocale = () => {
    const segments = pathname.split('/');
    const locale = segments[1];
    return locale === Languages.ARABIC || locale === Languages.ENGLISH ? locale : Languages.ARABIC;
  };

  const currentLocale = getCurrentLocale();
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  const switchLocale = (targetLocale: string) => {
    if (!pathname) return;
    if (targetLocale === currentLocale) return;

    const segments = pathname.split('/');
    if (segments.length > 1) {
      segments[1] = targetLocale;
      const nextPath = segments.join('/') || '/';
      router.push(nextPath);
      
      // حفظ اللغة في الكوكي
      document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=strict`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          className={cn(
            "gap-1.5 hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-button-primary",
            isMobile ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm",
            className
          )}
        >
          <Globe className={cn(
            "text-gray-600",
            isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
          )} />
          <span className={isMobile ? "text-sm" : "text-base"}>
            {currentLanguage.flag}
          </span>
          <span className={cn(
            "font-medium",
            isMobile ? "hidden" : "inline"
          )}>
            {currentLanguage.name}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={5}
        className={cn(
          "min-w-[160px] p-1",
          isMobile ? "w-[140px]" : "w-[180px]"
        )}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className={cn(
              "cursor-pointer gap-2 focus:bg-gray-100 focus:text-button-primary",
              currentLocale === lang.code && "bg-button-primary/10 text-button-primary font-medium",
              isMobile ? "text-xs py-2" : "text-sm py-2.5"
            )}
          >
            <span className={isMobile ? "text-sm" : "text-base"}>
              {lang.flag}
            </span>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium">
                  {lang.name}
                </span>
                <span className={cn(
                  "text-gray-500",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {lang.fullName}
                </span>
              </div>
              {currentLocale === lang.code && (
                <Check className={cn(
                  "text-button-primary",
                  isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                )} />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
