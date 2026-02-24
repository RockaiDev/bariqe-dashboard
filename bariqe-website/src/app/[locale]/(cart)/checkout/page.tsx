import { getTranslations } from 'next-intl/server';
import { CheckoutPage as CheckoutFeaturePage } from '@/features/cart';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';

  return {
    title: `${brand} | ${t('title')}`,
    description: t('description'),
  };
}

export default async function CheckoutPage() {
  return <CheckoutFeaturePage />;
}