'use client';

import { MapPin, Mail, Globe, PhoneCall } from 'lucide-react';
import { Languages } from '@/shared/constants/enums';
import { useTranslations } from 'next-intl';
import { BusinessInfo } from '@/lib/publicApiService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CONTACTMAIL, CONTACTPHONE } from '@/lib/data';
import { Link } from '@/i18n/routing';

// Fix Leaflet default marker icon issue in Next.js
// This is needed because Next.js handles static assets differently
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Interfaces
interface LeafletMapProps {
  businessInfo: BusinessInfo;
  isRTL: boolean;
  locale: Languages;
}

// الموقع الثابت للخريطة فقط
const FIXED_MAP_LOCATION = {
  center: [19.8652668, 42.61586] as [number, number], // تحديث الإحداثيات الجديدة (31°01'09.1"N 29°47'29.9"E)
  mapUrl: `https://www.google.com/maps/place/19%C2%B051'55.0%22N+42%C2%B037'06.4%22E/@19.8652668,42.61586,17z/data=!3m1!4b1!4m4!3m3!8m2!3d19.8652668!4d42.6184349?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D`,
  zoom: 17 // زيادة مستوى التكبير لعرض تفاصيل أكثر
};

export default function LeafletMap({ businessInfo, isRTL, locale }: LeafletMapProps) {
  const t = useTranslations('contact.map');

  // Add null safety check
  if (!businessInfo) {
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

  // Get localized data
  const companyName = locale === Languages.ARABIC ? businessInfo.title_ar : businessInfo.title_en;
  const mainAddress = locale === Languages.ARABIC ? businessInfo.address_ar : businessInfo.address_en;

  const openInGoogleMaps = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Google Maps Container */}
      <div
        className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden z-0"
      >
        <MapContainer
          center={FIXED_MAP_LOCATION.center}
          zoom={FIXED_MAP_LOCATION.zoom}
          style={{ height: '600px', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={FIXED_MAP_LOCATION.center}>
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">{companyName}</h3>
                {/* {mainAddress && <p className="text-sm">{mainAddress}</p>} */}
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Location Info Card */}
        {/* <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] max-w-xs`}>
          <h4 className="font-bold text-navy mb-1">{companyName}</h4>
          {mainAddress && (
            <p className="text-sm text-gray-600">{mainAddress}</p>
          )}
        </div> */}

        {/* Open in Maps Button */}
        <button
          onClick={() => openInGoogleMaps(FIXED_MAP_LOCATION.mapUrl)}
          className={`absolute bottom-4 ${isRTL ? 'left-4' : 'right-4'} bg-primary hover:bg-action-hover text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-20 flex items-center gap-2`}
        >
          <Globe className="w-5 h-5" />
          <span>{t('openInMaps')}</span>
        </button>
      </div>

      <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
        <Link href={'tel:' + CONTACTPHONE.split('-')} className='flex items-center justify-center gap-3 text-text-tertiary text-sm'>
          <span>{CONTACTPHONE}</span>
          <PhoneCall className='w-5 h-5' />
        </Link>
        <Link href={'tel:' + CONTACTMAIL.split('-')} className='flex items-center justify-center gap-3 text-text-tertiary text-sm'>
          <span>{CONTACTMAIL}</span>
          <Mail className='w-5 h-5' />
        </Link>
        <div className='flex items-center justify-center gap-3 text-text-tertiary text-sm border-l-2 border-gray-300 pl-4'>
          <div className='flex flex-col items-end gap-1'>
            <span className='text-xs text-gray-500 uppercase'>{locale === Languages.ARABIC ? 'العنوان المختصر' : 'National Address'}</span>
            <span className='font-bold text-primary'>AQGA2589</span>
          </div>
          <MapPin className='w-5 h-5' />
        </div>
      </div>


    </div>








  );
}

