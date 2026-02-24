// features/cart/components/cart/EmptyCart.tsx
"use client";

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export const EmptyCart = () => {
  const t = useTranslations('cart');

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4">


      <Image
        src="/empty-cart.svg"
        alt="Empty Cart"
        width={300}
        height={300}

      />


      <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2 text-center">
        {t('emptyCart.title')}
      </h2>



      <Button
        asChild
        className="rounded-full  w-full sm:w-auto px-8 sm:px-8 py-5 sm:py-6  text-sm "
        size="lg"
      >
        <Link href="/all-products" className="flex items-center gap-2">
          {t('emptyCart.browseProducts')}
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
