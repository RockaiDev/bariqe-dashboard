"use client";

import { usePathname } from "next/navigation";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

interface SearchComProps {
  onSearchChange?: (value: string) => void;
 }

const SearchCom = ({
  onSearchChange,
  
}: SearchComProps) => {
  const t = useTranslations('allProducts');
  const pathname = usePathname();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onSearchChange?.(value);
    }, 500); 
  };

 

  return (
    <Card
      className="w-fit flex flex-col-reverse  gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-4"
    >
   

      {/* Search input */}
      <div className=" text-text-secondary-2 body-medium">
        
        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            onChange={handleSearchChange}
            className="h-full border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      
    </Card>
  );
};

export default SearchCom;
