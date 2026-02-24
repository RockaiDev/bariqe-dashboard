import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageClient from './_components/pageClient';
import CustomBreadcrumb from '@/shared/components/CustomBreadcrumb';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';

  return {
    title: `${brand} | ${t('title')}`,
    description: t('subtitle'),
    keywords: ['contact', 'support', 'customer service', 'Bariqe Al-Tamyoz', 'بريق التميز'],
    openGraph: {
      title: `${brand} | ${t('title')}`,
      description: t('subtitle'),
      type: 'website',
      locale: locale,
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CustomBreadcrumb
          items={[
            {
              label: t('title')
            }
          ]}
        />
        <PageClient locale={locale} />
      </div>
    </div>
  );
}