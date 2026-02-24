// AppSidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Home,
  Package,
  // FileText,
  // MessageSquare,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Copy,
  Layers,
  Truck,
  Contact,
  Building2,
} from "lucide-react";

import Logo from "../assets/logoMain.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLogout } from "@/hooks/useLogout";
import { ConfirmLogoutDialog } from "@/components/shared/ConfirmLogoutDialog";
import { useIntl } from "react-intl";
import { useLanguage } from "../context/LanguageContext";
import useAuth from "@/hooks/useAuth";
import { scrollToTop } from "@/hooks/ScrollToTop"; // استيراد الـ function

export default function AppSidebar() {
  const logout = useLogout();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const { isRTL } = useLanguage();
  const { admin } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const navItems = [
    {
      icon: Home,
      label: intl.formatMessage({ id: "nav_dashboard" }),
      href: "/dashboard",
    },
    {
      icon: Package,
      label: intl.formatMessage({ id: "nav_products" }),
      href: "/products",
    },
    {
      icon: Layers,
      label: intl.formatMessage({ id: "nav_category" }),
      href: "/category",
    },
    // {
    //   icon: FileText,
    //   label: intl.formatMessage({ id: "nav_material_request" }),
    //   href: "/material-requests",
    // },
    {
      icon: Truck,
      label: intl.formatMessage({ id: "nav_orders" }),
      href: "/orders",
    },
    // {
    //   icon: MessageSquare,
    //   label: intl.formatMessage({ id: "nav_consultations" }),
    //   href: "/consultations",
    // },
    {
      icon: Users,
      label: intl.formatMessage({ id: "nav_customers" }),
      href: "/customers",
    },
    {
      icon: BarChart2,
      label: intl.formatMessage({ id: "nav_reports" }),
      href: "/reports",
    }, {
      icon: Contact,
      label: intl.formatMessage({ id: "nav_contact" }),
      href: "/contact",
    },
    {
      icon: Settings,
      label: intl.formatMessage({ id: "nav_settings" }),
      href: "/settings",
    },
    {
      icon: Building2,
      label: intl.formatMessage({ id: "nav_business_info" }),
      href: "/business-info",
    },

  ];

  // دالة للتنقل مع التمرير إلى الأعلى
  const handleNavigation = (href: string) => {
    navigate(href);
    scrollToTop(); // التمرير إلى أعلى الصفحة
  };

  return (
    <Sidebar
      collapsible="icon"
      side={isRTL ? "right" : "left"}
      className="!relative lg:!relative md:!fixed sm:!fixed !z-50 h-full"
      variant="sidebar"
    >
      {/* Header */}
      <SidebarHeader className="mb-3 lg:mb-5">
        <div
          className={`flex items-center gap-2 relative group ${isRTL ? "flex-row-reverse" : ""
            }`}
        >
          <div className="relative h-8 w-8 lg:h-10 lg:w-10">
            <img
              src={Logo}
              alt="logo"
              className="!h-8 !w-8 lg:!h-10 lg:!w-10 shrink-0 rounded-md"
            />
            {state === "collapsed" && (
              <SidebarTrigger
                className={`group-hover:!bg-black/60 !text-white absolute top-[50%] ${isRTL ? "left-0" : "right-0"
                  } -translate-y-1/2 hidden group-hover:flex p-3 lg:p-5 rounded-md items-center justify-center cursor-pointer`}
              />
            )}
          </div>

          {state === "expanded" && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-xs lg:text-sm truncate">
                {admin?.firstName ||
                  intl.formatMessage({ id: "sidebar_admin" })}
              </span>
              <div
                className={`flex items-center gap-1 text-xs text-gray-500 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <span className="truncate text-xs">
                  {admin?.email || "admin@demo.com"}
                </span>
                <Copy className="h-3 w-3 cursor-pointer shrink-0" />
              </div>
            </div>
          )}
          {state === "expanded" && <SidebarTrigger className="shrink-0" />}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="h-full">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="!gap-2 lg:!gap-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="!text-[#3E4043] !text-sm lg:!text-[16px] !leading-tight lg:!leading-[22.4px] !font-tajawal !font-medium"
                  >
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => handleNavigation(item.href)}
                        className={`flex items-center gap-2 w-full rounded-md px-2 py-2 transition cursor-pointer ${isRTL ? "flex-row-reverse text-right" : "text-left"
                          } ${isActive
                            ? "bg-[#E5EDFF] text-primary pointer-events-none"
                            : "hover:bg-gray-100"
                          }`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <item.icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
                        <span className="truncate text-xs lg:text-sm">
                          {item.label}
                        </span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="!cursor-pointer"
              onClick={() => setConfirmOpen(true)}
            >
              <div
                className={`flex items-center gap-2 w-full ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <LogOut className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
                {state === "expanded" && (
                  <span className="text-xs lg:text-sm truncate">
                    {intl.formatMessage({ id: "sidebar_logout" })}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Confirm logout dialog */}
      <ConfirmLogoutDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        isLoading={logout.isPending}
        onConfirm={() => {
          logout.mutate();
        }}
      />

      <SidebarRail />
    </Sidebar>
  );
}