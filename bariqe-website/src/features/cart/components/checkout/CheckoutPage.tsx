"use client";

import { useTranslations } from 'next-intl';
import CustomBreadcrumb from '@/shared/components/CustomBreadcrumb';
import FadeUpReval from '@/shared/animations/FadUpReval';
import { CheckoutForm } from './CheckoutForm';

export const CheckoutPage = () => {
  const t = useTranslations('checkout');

  return (
    <section className='max-w-7xl mx-auto py-8 px-2 '>
      <FadeUpReval >
        <CustomBreadcrumb
          items={
            [
              { label: t('orderSummary'), href: '/cart' },
              { label: t('title') }
            ]
          }
        />
      </FadeUpReval>

      <CheckoutForm />
    </section>
  )
}
