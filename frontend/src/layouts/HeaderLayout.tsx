import { type JSX, type ReactNode } from "react";
import AppSidebar from "./SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
import { useState } from "react";
import { ConfirmLogoutDialog } from "@/components/shared/ConfirmLogoutDialog";

type HeaderLayoutProps = { children: ReactNode };

export default function HeaderLayout({
  children,
}: HeaderLayoutProps): JSX.Element {
  return (
    <SidebarProvider className="min-h-screen font-tajawal w-screen !overflow-x-hidden">
      <div className="flex min-h-screen font-tajawal  w-screen !overflow-x-hidden">
        {/* Sidebar */}
        <AppSidebar />

        {/* Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="h-14 flex justify-between items-center border-b border-gray-200 bg-[#021031] px-4 lg:px-6 shrink-0">
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
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative w-8 h-8 rounded-full bg-white hover:bg-gray-100 transition-colors"
    >
      <Bell className="h-4 w-4 text-[#021031]" />
      <Badge
        variant="destructive"
        className="absolute -top-1 -right-1 h-2 w-2 p-0 border-2 border-white"
      >
        <span className="sr-only">New notifications</span>
      </Badge>
    </Button>
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
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-white/10">
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
            {intl.formatMessage({ id: "profile.settings", defaultMessage: "Profile Settings" })}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            {intl.formatMessage({ id: "auth.logout", defaultMessage: "Logout" })}
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