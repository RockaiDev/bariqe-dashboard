import { getTranslations } from 'next-intl/server';
import { CartPage as CartFeaturePage } from '@/features/cart';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  const brand = locale === 'ar' ? 'بريق التميز' : 'Bariqe Al-Tamyoz';

  return {
    title: `${brand} | ${t('metaTitle')}`,
    description: t('metaDescription'),
    keywords: ['cart', 'shopping cart', 'checkout', 'ecommerce', 'Bariqe Al-Tamyoz', 'بريق التميز'],
  };
}

export default async function CartPage() {
  return <CartFeaturePage />;
}