
import React from 'react';
import { getTranslations } from 'next-intl/server';
import ProfileTabs from '@/features/profile/components/ProfileTabs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });

  return {
    title: t('title'),
  };
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <ProfileTabs />
      </div>
    </div>
  );
}