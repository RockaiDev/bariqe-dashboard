"use client";
import { navigationLinks } from "@/lib/data";
import Image from "next/image";
import { ShoppingCart, ChevronLeft, Menu, Globe, Check, ChevronRight, User, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "@/shared/constants/enums";
import { useCart } from "@/shared/hooks/useCart";
import { useProfile } from "@/shared/hooks/useProfile";
import { useLogout } from "@/shared/hooks/useAuth";

import CustomButton from "./CustomButton";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/shared/components/ui/separator";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("");
  const router = useRouter();
  const locale = useLocale();
  const { items } = useCart();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const isAuthenticated = !!userProfile;



  const cartItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isRTL = locale === Languages.ARABIC;


  const en_logo = "/en_logo.svg";
  const ar_logo = "/logo.svg";

  // Close language menu on outside click or Escape
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLangOpen(false);
        setProfileOpen(false);
      }
    }
    if (langOpen || profileOpen) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [langOpen, profileOpen]);


  const CartButton = ({ className = "" }) => (
    <Link
      href="/cart"
      className={`flex cursor-pointer items-center justify-center 
         rounded-full transition-all duration-200 
        hover:scale-105 active:scale-95 relative ${className}`}
      aria-label="Shopping Cart"
    >
      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-icon-secondary" />
      {cartItemsCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
          font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center 
          px-1 shadow-md animate-in zoom-in duration-200"
        >
          {cartItemsCount > 99 ? "99+" : cartItemsCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky py-2 !select-none top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8" dir="">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          <div className="flex justify-between items-center">

            <div className="flex-shrink-0">
              <Link href="/" className="block">

                <Image
                  src={ar_logo}
                  alt="Logo"
                  width={200}
                  height={200}


                  quality={100}
                  priority
                  className="cover ltr:hidden"

                />

                <Image
                  src={en_logo}
                  alt="Logo"
                  width={180}
                  height={180}


                  quality={100}
                  priority
                  className="cover rtl:hidden"

                />

              </Link>
            </div>

            <div className="hidden lg:flex items-center justify-center flex-1 mx-4 xl:mx-8 " >
              <ul className="flex   items-center gap-3 lg:gap-4 xl:gap-8 2xl:gap-10 text-sm lg:text-base font-medium
           text-action
           "

              >
                {navigationLinks.map((link) => {
                  // Reconstruct the current path with query parameters
                  const currentSearchParams = searchParams.toString();
                  const fullPath = pathname + (currentSearchParams ? `?${currentSearchParams}` : "");

                  const isActive = fullPath === link.href;

                  return (
                    <li key={link.nameKey}>
                      <Link
                        href={link.href}

                        className={`hover:text-action-hover   
                       pb-1 transition-all duration-200 whitespace-nowrap
                       ${isActive
                            ? "text-action-hover text-lg"
                            : ""
                          }`}
                      >
                        {t(link.nameKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex ltr:flex-row-revers items-center justify-center gap-2 ltr:gap-4">
            <CartButton />
            <div className="relative" ref={langRef}>
              <button
                aria-label="Change language"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/20 text-text-secondary"
                onClick={() => setLangOpen((o) => !o)}
              >
                <Globe className="size-5 ml-1" />

              </button>
              {langOpen && (
                <div
                  role="menu"
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-18 sm:w-36 bg-white border rounded-md shadow-lg z-50 overflow-hidden`}
                >
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/20 `}
                    onClick={() => {
                      setLangOpen(false);
                      router.push(pathname, { locale: 'en' });
                    }}
                  >
                    <span>English</span>

                  </button>
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/20 `}
                    onClick={() => {
                      setLangOpen(false);
                      router.push(pathname, { locale: 'ar' });
                    }}
                  >
                    <span>العربية</span>

                  </button>
                </div>
              )}
            </div>
          
            {isProfileLoading ? (
               <Skeleton className="hidden lg:block h-10 w-24 rounded-md" />
            ) : isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <CustomButton 
                  onClick={() => setProfileOpen(!profileOpen)} 
                  className="hidden bg-[#004e6e] hover:bg-[#003b53] shadow-md text-white 
                  lg:flex items-center justify-center gap-1 px-4" 
                >
                  <User className="size-5" />
                  <p>{t('profile.btn') || "Profile"}</p>
                  <ChevronLeft className="ltr:hidden" />
                  <ChevronRight className="rtl:hidden" />
                </CustomButton>
                {profileOpen && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-40 bg-white border rounded-md shadow-lg z-50 overflow-hidden`}>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent/20 text-text-secondary-2"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push('/profile');
                      }}
                    >
                      <User className="size-4" />
                      <span>{t('profile.btn') || "Profile"}</span>
                    </button>
                    <Separator className="my-1" />
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-red-50 text-red-600"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      disabled={isLogoutPending}
                    >
                      <LogOut className="size-4" />
                      <span>{t('auth.messages.logout') || "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <CustomButton onClick={() => router.push('/login')} className="hidden  bg-action hover:bg-action-hover shadow-[0px_1px_10.2px_5px_#175A7E66]  text-text-primary 
              lg:flex items-center justify-center gap-1 px-4
              " >  <p>{t('login.btn')}</p> <ChevronLeft className="ltr:hidden" /> <ChevronRight className="rtl:hidden" /> </CustomButton>
            )}
            <Sidebar isAuthenticated={isAuthenticated} />
          </div>

        </div>
      </nav>
    </header>
  )

}


const Sidebar = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <Sheet>
      <SheetTrigger
        className={` ${cn(
          ` md:hidden text-text-secondary rounded-full px-3 py-2 cursor-pointer`
        )}`}
      >
        <Menu className="size-5 text-text-secondary" />
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-[400px]">
        <SheetHeader className="w-full flex items-start justify-center  h-[55px]  sticky">
          <SheetTitle></SheetTitle>

        </SheetHeader>
        <MobilleNav isAuthenticated={isAuthenticated} />
      </SheetContent>
    </Sheet>
  );
};



const MobilleNav = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const t = useTranslations('');
  const searchParams = useSearchParams();
  const p = usePathname();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  return (
    <nav>
      <ul className="flex items-center w-full  flex-col justify-center gap-1">

        {navigationLinks.map((item, index) => {
          const currentSearchParams = searchParams.toString();
          const fullPath = p + (currentSearchParams ? `?${currentSearchParams}` : "");
          const isActive = fullPath === item.href;

          return (
            <li key={index} className="w-full">
              <SheetClose asChild>
                <Link
                  className={`w-full px-6 py-4 flex items-center justify-between cursor-pointer text-[16px] font-semibold hover:bg-accent/30 ${isActive ? 'text-action-hover bg-accent/10' : 'text-text-secondary-2'}`}
                  href={item.href}
                >
                  {/* <item.icon className="size-5" /> */}
                  {t(item.nameKey)}
                </Link>
              </SheetClose>
              <Separator className="bg-text-secondary h-1" />
            </li>
          )
        })}
        {isAuthenticated ? (
          <>
            <li className="w-full">
              <SheetClose asChild>
                <Link
                  className="w-full px-6 py-4 flex items-center justify-between cursor-pointer text-[16px] font-semibold hover:bg-accent/30 text-text-secondary-2"
                  href="/profile"
                >
                  <div className="flex items-center gap-2">
                    <User className="size-5" />
                    {t('profile.btn') || "Profile"}
                  </div>
                  <ChevronRight className="size-5 rtl:rotate-180" />
                </Link>
              </SheetClose>
              <Separator className="bg-text-secondary h-1" />
            </li>
            <li className="w-full">
              <SheetClose asChild>
                <button
                  className="w-full px-6 py-4 flex items-center justify-between cursor-pointer text-[16px] font-semibold hover:bg-red-50 text-red-600"
                  onClick={() => logout()}
                  disabled={isLogoutPending}
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="size-5" />
                    {t('auth.messages.logout') || "Logout"}
                  </div>
                  <ChevronRight className="size-5 rtl:rotate-180" />
                </button>
              </SheetClose>
              <Separator className="bg-text-secondary h-1" />
            </li>
          </>
        ) : (
          <li className="w-full">
            <SheetClose asChild>
              <Link
                className={`w-full px-6 py-4 flex items-center justify-between cursor-pointer text-[16px] font-semibold hover:bg-accent/30 text-text-secondary-2`}
                href="/login"
              >
                <div className="flex items-center gap-2">
                  <User className="size-5" />
                  {t('login.btn')}
                </div>
                <ChevronRight className="size-5 rtl:rotate-180" />
              </Link>
            </SheetClose>
            <Separator className="bg-text-secondary h-1" />
          </li>
        )}
      </ul>


    </nav>
  );
}
