
import BestSellerSection from "@/features/home/components/BestSellerSection";
import CustomerReviews from "@/features/home/components/CustomerReviews";
import Hero from "@/features/home/components/Hero";
import HomeBanner from "@/features/home/components/HomeBanner";
import NewArrivals from "@/features/home/components/NewArrivals";

import SpecialSection from "@/features/home/components/SpecialSection";
import PartnersSection from "@/features/home/components/PartnersSection";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';

  return {
    title: `${brand} | ${t('title')}`,
    description: t('description'),
    keywords: ['ecommerce', 'cleaning products', 'detergents', 'offers', 'packages', 'Bariqe Al-Tamyoz', 'بريق التميز'],
    openGraph: {
      title: `${brand} | ${t('title')}`,
      description: t('description'),
      type: 'website',
      locale: locale,
    },
  };
}

export default function Home() {
  return (
    <main className="min-h-screen">


      <Hero />

      <SpecialSection />
      <BestSellerSection />
      <HomeBanner />
      {/* <NewArrivals /> */}
      <CustomerReviews />
      <PartnersSection />
    </main>
  );
}
