// components/shared/PageLoading.tsx
"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingComponent from './LoadingComponent';

export default function PageLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('Loading...');
  const pathname = usePathname();

  useEffect(() => {
    // Determine locale from pathname and set a localized loading message
    const locale = pathname?.split('/')?.[1];
    if (locale === 'ar') {
      setMessage('جارٍ التحميل...');
    } else {
      setMessage('Loading...');
    }

    // محاكاة وقت التحميل
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return <LoadingComponent message={message} fullScreen={true} />;
}
