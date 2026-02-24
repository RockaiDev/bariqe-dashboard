import type { Metadata } from "next";
import { DM_Serif_Text, IBM_Plex_Sans_Arabic } from "next/font/google";
import './globals.css'
import "@emran-alhaddad/saudi-riyal-font/index.css";

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import Providers from "@/lib/providers/Providers";
import 'leaflet/dist/leaflet.css';
import { Suspense } from "react";
import Loading from "../loading";
import { Languages } from '@/shared/constants/enums';
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import TopHeader from "@/shared/components/TopHeader";
import ScrollUpButton from "@/shared/components/ScrollUpButton";
import SplashCursor from "@/components/SplashCursor";


const dmSerifText = DM_Serif_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

const locales = [Languages.ARABIC, Languages.ENGLISH];

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';

  return {
    title: {
      default: `${brand}`,
      template: `%s | ${brand}`
    },
    description: t('description'),
    keywords: ['cleaning products', 'ecommerce', 'detergents', 'offers', 'packages', 'Bariqe Al-Tamyoz', 'بريق التميز'],
    authors: [{ name: brand }],
    creator: brand,
    publisher: brand,

    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    alternates: {
      languages: {
        'ar': '/ar',
        'en': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: '/',
      siteName: brand,
      title: `${brand}`,
      description: t('description'),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand}`,
      description: t('description'),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Languages)) {
    notFound();
  }

  const messages = await getMessages();

  if (process.env.NODE_ENV === 'production') {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
    console.warn = () => { };
  }

  // Use ibmPlexSansArabic for both Arabic and English
  const fontClass = ibmPlexSansArabic.className;

  return (
    <html lang={locale} dir={locale === Languages.ARABIC ? "rtl" : "ltr"}>
      <body
        className={`${fontClass} antialiased`}
        suppressHydrationWarning={true}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Suspense fallback={<Loading />}>
              <div className="min-h-screen flex flex-col relative">

                <TopHeader />
                <Header />
                {/* <WhatsAppIcon /> */}
                <ScrollUpButton />

                <main className="flex-1">
                  <Suspense fallback={<Loading />}>
                    <NuqsAdapter>

                      {children}
                    </NuqsAdapter>
                    {/* <SplashCursor /> */}
                  </Suspense>
                </main>
                <Footer />
              </div>
            </Suspense>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}