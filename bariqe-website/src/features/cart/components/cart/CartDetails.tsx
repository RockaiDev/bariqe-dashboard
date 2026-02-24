"use client";

import { useTranslations } from 'next-intl';
import { useCart } from '@/shared/hooks/useCart';
import { Card } from '@/shared/components/ui/card';
import CustomButton from '@/shared/components/CustomButton';
import { Link } from '@/i18n/routing';

interface CartDetailsProps {
    items: any[];
    total: number;
}

export const CartDetails = ({ items, total }: CartDetailsProps) => {
    const t = useTranslations('cart');
    const subtotal = items.reduce((sum, item: any) => sum + item.price * item.quantity, 0);
    // const { clearCart } = useCart() // Unused in this updated component logic as handleOrder was removed/commented out in original but kept logic
    const safeTotal = (total == null || isNaN(total) || !isFinite(total)) ? 0 : total;
    const safeSubtotal = (subtotal == null || isNaN(subtotal) || !isFinite(subtotal)) ? 0 : subtotal;
    const discount = Math.max(0, safeSubtotal - safeTotal);

    return (
        <Card className=' lg:px-12 flex px-4 flex-col gap-5' >
            <h2 className='body-large text-primary font-semibold'>{t('orderSummary')}</h2>
            <div className='flex justify-between items-center py-2'>
                <p className='body-medium text-icon-tertiary'>{t('subtotal')}</p>
                <p className='body-large text-primary font-semibold'>{safeSubtotal.toFixed(2)} <span style={{ fontSize: '20px' }} className="icon-saudi_riyal_new"></span></p>
            </div>
            <div className='flex justify-between items-center py-2'>
                <p className='body-medium text-icon-tertiary'>{t('shipping')}</p>
                <div className='flex items-center gap-2'>
                    <p className='body-medium text-gray-400 line-through'>{(15).toFixed(2)} <span style={{ fontSize: '16px' }} className="icon-saudi_riyal_new"></span></p>
                    <p className='text-sm font-bold text-green-600'>FREE</p>
                </div>
            </div>
            <div className='flex justify-between items-center py-2'>
                <p className='body-medium text-icon-tertiary'>{t('discount')}</p>
                <p className='body-large text-primary font-semibold'>-{discount.toFixed(2)} <span style={{ fontSize: '20px' }} className="icon-saudi_riyal_new"></span></p>
            </div>
            <div className='h-0.5 w-full bg-text-secondary' />
            <div className='flex justify-between items-center'>
                <p className='body-large text-primary font-bold'>{t('total')}</p>
                <p className='body-large text-primary font-semibold'>{safeTotal.toFixed(2)} <span style={{ fontSize: '28px' }} className=" icon-saudi_riyal_new"></span></p>
            </div>

            <Link href={'/checkout'}>
                <CustomButton
                    className='bg-primary hover:bg-secondary w-full text-white py-2 px-4 sm:w-'>
                    <span>{t('proceedToCheckout')}</span> </CustomButton>
            </Link>
        </Card>
    )
}
