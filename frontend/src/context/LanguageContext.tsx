// contexts/LanguageContext.tsx
import  { createContext, useContext, useEffect,type ReactNode } from 'react';

export interface Language {
  code: 'en' | 'ar';
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  {
    code: 'ar',
    name: 'Arabic', 
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl'
  }
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (languageCode: 'en' | 'ar') => void;
  isRTL: boolean;
  locale: 'en' | 'ar';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  locale: 'en' | 'ar';
  setLocale: (locale: 'en' | 'ar') => void;
}

export function LanguageProvider({ children, locale, setLocale }: LanguageProviderProps) {
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const setLanguage = (languageCode: 'en' | 'ar') => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
   
      setLocale(languageCode);
      
 
      localStorage.setItem("locale", languageCode);
      
     
      document.documentElement.dir = language.dir;
      document.documentElement.lang = language.code;

      document.documentElement.classList.remove('rtl', 'ltr');
      document.documentElement.classList.add(language.dir);
    }
  };

  useEffect(() => {
    document.documentElement.dir = currentLanguage.dir;
    document.documentElement.lang = currentLanguage.code;
    document.documentElement.classList.remove('rtl', 'ltr');
    document.documentElement.classList.add(currentLanguage.dir);
  }, [currentLanguage]);

  const isRTL = currentLanguage.dir === 'rtl';

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isRTL,
    locale
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}


export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}