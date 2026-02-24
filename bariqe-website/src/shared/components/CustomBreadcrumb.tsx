"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/ui/breadcrumb";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { Languages } from "@/shared/constants/enums";
interface Crumb {
  label: string;
  href?: string;
}

interface CustomBreadcrumbProps {
  items: Crumb[];
}

const CustomBreadcrumb = ({ items }: CustomBreadcrumbProps) => {
  const pathname = usePathname();
     const getCurrentLocale = () => {
        const segments = pathname.split("/");
        return segments[1] === "ar" ? Languages.ARABIC : Languages.ENGLISH;
      };
    
      const locale = getCurrentLocale();
      const currentLocale = locale === Languages.ARABIC ? "ar" : "en";
      const isRTL = locale === Languages.ARABIC;
    
  return (
    <Breadcrumb>
      <BreadcrumbList>
      
        {/* Home Icon */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <Home className="w-4 h-4" />
           
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.length > 0 && <BreadcrumbSeparator > 
        
        {isRTL ? <ChevronLeft /> : <ChevronRight />}
        </BreadcrumbSeparator>}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div className="flex items-center" key={index}>
              <BreadcrumbItem>
                {!isLast ? (
                  <BreadcrumbLink href={item.href || "#"}>
                     {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-action-hover body-medium">{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator > 
              {isRTL ? <ChevronLeft /> : <ChevronRight />}
              </BreadcrumbSeparator>}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;

