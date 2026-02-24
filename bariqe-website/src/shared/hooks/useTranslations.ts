import { useTranslations as useNextIntlTranslations } from 'next-intl';

export const useTranslations = (namespace: string) => {
  return useNextIntlTranslations(namespace);
};

export type TranslationFunction = ReturnType<typeof useTranslations>;

