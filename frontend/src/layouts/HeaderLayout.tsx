import { type JSX, type ReactNode } from "react";
import AppSidebar from "./SideBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import useAuth from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";

import { ConfirmLogoutDialog } from "@/components/shared/ConfirmLogoutDialog";
import { useScrollToTop } from "@/hooks/ScrollToTop";
import { useCrud } from "@/hooks/useCrud";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Eye, Mail, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
type HeaderLayoutProps = { children: ReactNode };

export default function HeaderLayout({
  children,
}: HeaderLayoutProps): JSX.Element {
  useScrollToTop();
  return (
    <SidebarProvider className="min-h-screen font-tajawal w-screen !overflow-x-hidden">
      <div className="flex min-h-screen font-tajawal  w-screen !overflow-x-hidden">
        {/* Sidebar */}
        <AppSidebar />

        {/* Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="h-14 flex justify-between items-center border-b border-gray-200 bg-[#021031] px-4 lg:px-6 shrink-0">
            <div className="">
              <SidebarTrigger className="lg:hidden text-black bg-white hover:text-primary transition-colors" />
            </div>
            {/* Search bar in the middle */}

            <div className="flex flex-1 max-w-md mx-auto">
              {/* Search functionality can be added here */}
            </div>

            {/* Right Side: language selector, notifications, avatar */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Language selector */}
              <LanguageSelector />

              {/* Notifications */}
              <NotificationButton />

              {/* Avatar */}
              <AvatarArea />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden bg-gray-50 font-tajawal ">
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 ">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function NotificationButton() {
  const navigate = useNavigate();
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  // ✅ Fetch unread contacts (status = false)
  const { list } = useCrud("contacts", {
    page: 1,
    perPage: 10,
    sorts: [{ field: "createdAt", direction: "desc" as const }],
    queries: [["status", "==", false]],
  });

  const unreadContacts = list.data?.data || [];
  const unreadCount = list.data?.count || 0;

  // ✅ Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      list.refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleViewContact = (contactId: string) => {
    setOpen(false);
    navigate(`/contact?view=${contactId}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/contact");
  };

  const getRelativeTime = (date: string) => {
    const locale = intl.locale === "ar" ? ar : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-8 h-8 rounded-full bg-white hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-4 w-4 text-[#021031]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 border-2 border-white flex items-center justify-center text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {intl.formatMessage({ id: "notifications.new_contacts" })}
          </h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="font-medium text-white">
              {unreadCount}
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {unreadContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">
                {intl.formatMessage({ id: "notifications.no_new_contacts" })}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {unreadContacts.map((contact: any) => (
                <div
                  key={contact._id}
                  onClick={() => handleViewContact(contact._id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">
                          {contact.contactName}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {contact.createdAt &&
                            getRelativeTime(contact.createdAt)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phoneNumber}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {contact.message}
                      </p>

                      {contact.services && contact.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.services
                            .slice(0, 2)
                            .map((service: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {service.split(" ")[0]}
                              </Badge>
                            ))}
                          {contact.services.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{contact.services.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {unreadCount > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm font-medium"
              onClick={handleViewAll}
            >
              {intl.formatMessage({ id: "notifications.view_all_contacts" })}
              <Eye className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AvatarArea() {
  const { admin } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const intl = useIntl();

  const handleProfile = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    setConfirmOpen(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0 hover:bg-white/10"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  admin?.avatar ||
                  `https://i.pravatar.cc/32?u=${admin?.email || "guest"}`
                }
                alt={admin?.firstName || "Admin"}
              />
              <AvatarFallback className="bg-[#021031] text-white text-xs">
                {getInitials(admin?.firstName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {admin?.firstName || "Admin"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {admin?.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
            {intl.formatMessage({
              id: "profile.settings",
              defaultMessage: "Profile Settings",
            })}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            {intl.formatMessage({
              id: "auth.logout",
              defaultMessage: "Logout",
            })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmLogoutDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          logout.mutate();
        }}
      />
    </>
  );
}
