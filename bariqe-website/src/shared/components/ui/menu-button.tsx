// components/ui/menu-button.tsx
"use client";

import { Button } from "@/shared/components/ui/button";
import { Menu } from "lucide-react";

interface MenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MenuButton({ onClick, className = "" }: MenuButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg border-gray-200 hover:bg-gray-50 ${className}`}
      onClick={onClick}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
