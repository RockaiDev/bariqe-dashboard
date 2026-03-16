"use client";

import { Card, CardHeader } from '@/shared/components/ui/card';
import { Link } from '@/i18n/routing';
import { SquarePen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import FadeUpReval from '@/shared/animations/FadUpReval';
import { CheckoutCard } from './CheckoutCard';

interface OrderSummaryProps {
    items: any[];
    total: number;
}

export const OrderSummary = ({ items, total }: OrderSummaryProps) => {
    const t = useTranslations('checkout');
    const tc = useTranslations('common');
    const local = useLocale();

    const subtotal = items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
    const discount = Math.max(0, subtotal - total);

    return (
        <FadeUpReval delay={0.05} className="lg:col-span-1">
            <div className="sticky top-4">
                <Card className='p-0 overflow-hidden shadow-lg'>
                    <CardHeader className='bg-primary/5 flex items-center justify-between py-4 px-4'>
                        <p className='text-primary font-semibold'>{t('orderSummary')}</p>
                        <Link href='/cart' className='flex items-center gap-1 text-sm text-primary hover:text-secondary transition-colors'>
                            <SquarePen className='w-4 h-4' />
                            <span className='underline'>{t('buttons.reviewOrder')}</span>
                        </Link>
                    </CardHeader>
                    
                    {/* Cart Items */}
                    <div className='max-h-[300px] overflow-y-auto'>
                        {items.map((item: any, index: number) => (
                            <CheckoutCard
                                key={item.id || index}
                                id={item.id}
                                name={local === 'en' ? item.product?.productNameEn : item.product?.productNameAr || 'Product'}
                                price={item.price}
                                quantity={item.quantity}
                                discount={item.discount || 0}
                                image={item.product?.productImage}
                            />
                        ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className='p-4 space-y-3 border-t'>
                        <div className='flex justify-between items-center text-sm'>
                            <span className='text-gray-500'>{t('subtotal')}</span>
                            <span className='font-medium whitespace-nowrap'>{subtotal.toFixed(2)} <span className="icon-saudi_riyal_new text-sm"></span></span>
                        </div>
                        <div className='flex justify-between items-center text-sm'>
                            <span className='text-gray-500'>{t('shipping')}</span>
                            <div className='flex items-center gap-2'>
                                <span className='text-gray-400 line-through text-xs'>15.00</span>
                                <span className='text-green-600 font-bold text-xs'>{tc('free') || 'FREE'}</span>
                            </div>
                        </div>
                        {discount > 0 && (
                            <div className='flex justify-between items-center text-sm'>
                                <span className='text-gray-500'>{t('discount')}</span>
                                <span className='text-green-600 font-medium whitespace-nowrap'>-{discount.toFixed(2)} <span className="icon-saudi_riyal_new text-sm"></span></span>
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className='flex justify-between items-center p-4 bg-primary/5 border-t'>
                        <span className='text-primary font-bold text-lg'>{t('total')}</span>
                        <span className='text-primary font-bold text-xl whitespace-nowrap'>
                            {total.toFixed(2)} <span className="icon-saudi_riyal_new text-lg"></span>
                        </span>
                    </div>

                    
                </Card>
            </div>
        </FadeUpReval>
    );
};
