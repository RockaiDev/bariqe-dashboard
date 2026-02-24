// components/LanguageSelector.tsx
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLanguage, languages } from "../../context/LanguageContext";

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <Select value={currentLanguage.code} onValueChange={setLanguage}>
      <SelectTrigger className="w-40 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="font-medium">{currentLanguage.name}</span>
          </div>
        </div>
      </SelectTrigger>

      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
        {languages.map((language) => (
          <SelectItem
            key={language.code}
            value={language.code}
            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-xl">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {language.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {language.nativeName}
                  </span>
                </div>
              </div>
           
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}