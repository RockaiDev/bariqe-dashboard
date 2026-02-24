'use client';
import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Languages } from '@/shared/constants/enums';
import { usePublicBusinessInfo } from '@/shared/hooks/usePublicApi';
import 'leaflet/dist/leaflet.css';
import { BusinessInfo } from '@/lib/publicApiService';




// export const business: BusinessInfo = {
//   _id: "673a1f8e9c1b2f0012a34567",
//   title_ar: "شركة بريق",
//   title_en: "Bariq Company",
//   description_ar: "شركة متخصصة في منتجات التنظيف وخدمات التطهير.",
//   description_en: "A company specialized in cleaning products and sanitation services.",
//   logo: "https://example.com/images/logo.png",
//   email: "info@bariq.com",
//   phone: "+201234567890",
//   whatsapp: "+201234567890",
//   address_ar: "القاهرة، مصر",
//   address_en: "Cairo, Egypt",
//   facebook: "https://facebook.com/bariq",

//   about: {
//     hero_image: "https://example.com/images/about-hero.jpg",
//     main_title_ar: "من نحن",
//     main_title_en: "About Us",
//     main_description_ar: "نقدم أفضل منتجات وخدمات النظافة بفضل فريق متخصص وخبرة طويلة.",
//     main_description_en: "We provide high-quality cleaning products and services backed by years of experience.",
//     sections: [
//       {
//         title_ar: "رؤيتنا",
//         title_en: "Our Vision",
//         description_ar: "أن نكون الشركة الرائدة في حلول التنظيف في المنطقة.",
//         description_en: "To be the leading cleaning solutions provider in the region.",
//         image: "https://example.com/images/vision.jpg",
//       },
//       {
//         title_ar: "رسالتنا",
//         title_en: "Our Mission",
//         description_ar: "تقديم منتجات عالية الجودة بأسعار مناسبة مع ضمان رضا العملاء.",
//         description_en: "Delivering top-quality products at fair prices while ensuring customer satisfaction.",
//         image: "https://example.com/images/mission.jpg",
//       },
//     ],
//   },

//   locations: [
//     {
//       city_ar: "القاهرة",
//       city_en: "Cairo",
//       address_ar: "شارع التسعين، التجمع الخامس",
//       address_en: "90th Street, New Cairo",
//       lat: 30.029,
//       lng: 31.022,
//     },
//     {
//       city_ar: "الإسكندرية",
//       city_en: "Alexandria",
//       address_ar: "سيدي بشر، شارع خالد بن الوليد",
//       address_en: "Sidi Bishr, Khaled Ibn Al Walid St",
//       lat: 31.241,
//       lng: 29.966,
//     },
//   ],

//   members: [
//     {
//       name_ar: "أحمد علي",
//       name_en: "Ahmed Ali",
//       role_ar: "المدير التنفيذي",
//       role_en: "CEO",
//       image: "https://example.com/images/team1.jpg",
//     },
//     {
//       name_ar: "سارة محمد",
//       name_en: "Sara Mohamed",
//       role_ar: "مديرة التسويق",
//       role_en: "Marketing Manager",
//       image: "https://example.com/images/team2.jpg",
//     },
//   ],

//   partners: [
//     {
//       name_ar: "شركة النظافة الحديثة",
//       name_en: "Modern Cleaning Co.",
//       logo: "https://example.com/images/partner1.png",
//       url: "https://partner1.com",
//     },
//     {
//       name_ar: "كيماويات كلين",
//       name_en: "Clean Chemicals",
//       logo: "https://example.com/images/partner2.png",
//       url: "https://partner2.com",
//     },
//   ],

//   reviews: {
//     hero_image: "https://example.com/images/reviews-hero.jpg",
//     main_title_ar: "آراء العملاء",
//     main_title_en: "Customer Reviews",
//     main_description_ar: "نفخر بثقة عملائنا بنا وبخدماتنا ومنتجاتنا على مدار السنوات.",
//     main_description_en: "We are proud of our customers' trust in our products and services.",
//     items: [
//       {
//         name: "Mohamed Hassan",
//         rating: 5,
//         comment_ar: "منتجات ممتازة وخدمة رائعة.",
//         comment_en: "Excellent products and great service.",
//         image: "https://example.com/images/review1.jpg",
//       },
//       {
//         name: "Laila Samir",
//         rating: 4,
//         comment_ar: "جودة عالية وسعر مناسب.",
//         comment_en: "High quality and reasonable prices.",
//         image: "https://example.com/images/review2.jpg",
//       },
//     ],
//   },

//   is_active: true,
//   createdAt: "2025-01-01T12:00:00.000Z",
//   updatedAt: "2025-01-01T12:00:00.000Z",
// };



const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  { 
    ssr: false,
    loading: () => <LoadingMap />
  }
);

function LoadingMap() {
  const t = useTranslations('contact.map');
  
  return (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-600 text-sm font-medium">{t('loading')}</p>
      </div>
    </div>
  );
}

export default function ContactMap() {
  const pathname = usePathname();
  const { data: businessInfo, isLoading } = usePublicBusinessInfo({
    showErrorToast: false,
  });

  
  const getCurrentLocale = () => {
    const segments = pathname.split('/');
    return segments[1] === 'ar' ? Languages.ARABIC : Languages.ENGLISH;
  };

  const locale = getCurrentLocale();
  const isRTL = locale === Languages.ARABIC;

  if (isLoading || !businessInfo) {
    return <LoadingMap />;
  }
 

  return <LeafletMap businessInfo={businessInfo?.result} isRTL={isRTL} locale={locale} />;
}