"use client";

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import CustomBreadcrumb from '@/shared/components/CustomBreadcrumb';
import FadUpReval from '@/shared/animations/FadUpReval';
import { CartClientPage } from './CartClientPage';
import { CartSkeleton } from './CartSkeleton';

export const CartPage = () => {
  const t = useTranslations('cart');

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <FadUpReval>
        <CustomBreadcrumb
          items={[
            { label: t('title') },
          ]}
        />
      </FadUpReval>

      <FadUpReval delay={0.05}>
        <Suspense fallback={<CartSkeleton />}>
          <CartClientPage />
        </Suspense>
      </FadUpReval>
    </div>
  );
}
