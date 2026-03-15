import CustomBanner from "@/shared/components/CustomBanner";
import CustomBreadcrumb from "@/shared/components/CustomBreadcrumb";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import SpecialSection from "@/features/home/components/SpecialSection";
import { CheckmarkIcon } from "react-hot-toast";
import Banner from "./_components/Banner";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aboutPage' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bariqealtamyoz.com';

  const title = `${brand} | ${t('breadcrumb')}`;
  const description = locale === 'ar'
    ? 'نحن علامة تجارية سعودية متخصصة في منتجات التنظيف عالية الجودة التي تجمع بين الكفاءة والأمان والروائح الفاخرة. رؤيتنا هي جعل كل منزل سعودي أنظف وأكثر انتعاشاً.'
    : 'We are a Saudi brand specializing in high-quality cleaning products that combine efficiency, safety, and luxurious fragrances. Our vision is to make every Saudi home cleaner and more refreshed.';

  const keywords = locale === 'ar'
    ? ['عنا', 'بريق التميز', 'منتجات تنظيف سعودية', 'منتجات تنظيف', 'جودة عالية', 'عن الشركة', 'منتجات صنع في السعودية', 'تنظيف منزلي', 'روائح فاخرة']
    : ['about us', 'Bariqe Al-Tamyoz', 'Saudi cleaning products', 'cleaning products', 'high quality', 'about company', 'made in Saudi Arabia', 'home cleaning', 'luxury fragrances'];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages: {
        'en': `${siteUrl}/en/about`,
        'ar': `${siteUrl}/ar/about`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      url: `${siteUrl}/${locale}/about`,
      siteName: brand,
      images: [
        {
          url: `${siteUrl}/about/side.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/about/side.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations('aboutPage');
  const title = t('whyUs.title');
  const whyUs = [
    t('whyUs.items.0'),
    t('whyUs.items.1'),
    t('whyUs.items.2'),
    t('whyUs.items.3'),
    t('whyUs.items.4'),
  ];
  return (
    <section className="pb-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto my-3 px-4">
        <CustomBreadcrumb items={[
          { label: t('breadcrumb') },
        ]} />
      </div>
      <Banner />
      <div
        className="max-w-7xl mx-3 sm:mx-auto my-5  between-flex flex-col-reverse lg:flex-row"
      >
        <div className="max-w-2xl">
          <h2 className="text-primary text-xl sm:text-3xl font-semibold mb-5">{title}</h2>
          <ul>

            {whyUs.map((feature, index) =>
              <li key={index} className='w-full flex items-center justify-start gap-2 mb-2'>
                <CheckmarkIcon className='text-primary' />
                <p className='max-w-xl body-meduim lg:body-large  text-text-secondary-2'>{feature}</p>
              </li>
            )}

          </ul>
        </div>
        <Image
          src="/about/side.png"
          alt="about"
          width={700}
          height={700}
        />
      </div>
      <h1 className="text-primary text-xl font-semibold mb-5 sm:text-3xl text-center">{t('whatSetsUsApart')}</h1>
      <SpecialSection />

    </section>
  );
}