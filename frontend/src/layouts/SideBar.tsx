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
  FileText,
  MessageSquare,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Copy,
  Layers,
  Truck,
} from "lucide-react";

import Logo from "../assets/logoMain.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLogout } from "@/hooks/useLogout";
import { ConfirmLogoutDialog } from "@/components/shared/ConfirmLogoutDialog";
import { useIntl } from "react-intl";
import { useLanguage } from "../context/LanguageContext";
import useAuth from "@/hooks/useAuth";

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
    {
      icon: FileText,
      label: intl.formatMessage({ id: "nav_material_request" }),
      href: "/material-requests",
    },
    {
      icon: Truck,
      label: intl.formatMessage({ id: "nav_orders" }),
      href: "/orders",
    },
    {
      icon: MessageSquare,
      label: intl.formatMessage({ id: "nav_consultations" }),
      href: "/consultations",
    },
    {
      icon: Users,
      label: intl.formatMessage({ id: "nav_customers" }),
      href: "/customers",
    },
    {
      icon: BarChart2,
      label: intl.formatMessage({ id: "nav_reports" }),
      href: "/reports",
    },
    {
      icon: Settings,
      label: intl.formatMessage({ id: "nav_settings" }),
      href: "/settings",
    },
    // {
    //   icon: HelpCircle,
    //   label: intl.formatMessage({ id: 'nav_help' }),
    //   href: "/help"
    // },
  ];

  return (
    <Sidebar
      collapsible="icon"
      side={isRTL ? "right" : "left"}
      className="!relative"
    >
      {/* Header */}
      <SidebarHeader className=" mb-5">
        <div
          className={`flex items-center gap-2 relative group ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div className="relative h-10 w-10">
            <img
              src={ Logo}
              alt="logo"
              className="!h-10 !w-10 shrink-0 rounded-md"
            />
            {state === "collapsed" && (
              <SidebarTrigger
                className={`group-hover:!bg-black/60 !text-white absolute top-[50%] ${
                  isRTL ? "left-0" : "right-0"
                } -translate-y-1/2 hidden group-hover:flex p-5 rounded-md items-center justify-center cursor-pointer`}
              />
            )}
          </div>

          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {admin?.firstName ||
                  intl.formatMessage({ id: "sidebar_admin" })}
              </span>
              <div
                className={`flex items-center gap-1 text-xs text-gray-500 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <span>{admin?.email || "admin@demo.com"}</span>
                <Copy className="h-3 w-3 cursor-pointer" />
              </div>
            </div>
          )}
          {state === "expanded" && <SidebarTrigger />}
        </div>

        {/* {state === "expanded" ? (
          // ✅ يظهر input كامل
          <div className="relative mt-3">
            <Search className={`absolute top-2.5 h-4 w-4 text-gray-400 ${isRTL ? 'right-2' : 'left-2'}`} />
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'sidebar_search_placeholder' })}
              className={`w-full py-2 text-sm rounded-md border border-gray-200 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none ${
                isRTL ? 'pr-8 pl-2 text-right' : 'pl-8 pr-2 text-left'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        ) : (
          // ✅ collapsed: أيقونة فقط بخلفية #f5f5f5
          <div className="flex items-center justify-center mt-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-md bg-[#f5f5f5] hover:bg-gray-300 transition">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        )} */}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="!gap-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="!text-[#3E4043] !text-[16px] !leading-[22.4px] !font-tajawal !font-medium"
                  >
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => navigate(item.href)}
                        className={`flex items-center gap-2 w-full rounded-md px-2 py-2 transition cursor-pointer ${
                          isRTL ? "flex-row-reverse text-right" : "text-left"
                        } ${
                          isActive
                            ? "bg-[#E5EDFF] text-primary pointer-events-none"
                            : "hover:bg-gray-100"
                        }`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
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
                className={`flex items-center gap-2 w-full ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <LogOut className="h-5 w-5" />
                {state === "expanded" && (
                  <span>{intl.formatMessage({ id: "sidebar_logout" })}</span>
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
        onConfirm={() => logout.mutate()}
      />

      <SidebarRail />
    </Sidebar>
  );
}
