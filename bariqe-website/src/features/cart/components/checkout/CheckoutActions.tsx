"use client";

import { Link } from '@/i18n/routing';
import { Info, CreditCard, Loader2 } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

interface CheckoutActionsProps {
  isSubmitting: boolean;
}

export const CheckoutActions = ({ isSubmitting }: CheckoutActionsProps) => {
    const t = useTranslations('checkout');
    const tc = useTranslations('common');

    return (
        <div className='space-y-6'>
            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row items-center gap-3'>
                <CustomButton 
                    disabled={isSubmitting} 
                    type='submit' 
                    className='w-full sm:flex-1 py-3 px-8 bg-primary hover:bg-secondary text-white font-medium text-base flex items-center justify-center gap-2'
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {tc('processing') || 'Processing...'}
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-5 h-5" />
                            {t('buttons.confirmOrder')}
                        </>
                    )}
                </CustomButton>
                <CustomButton 
                    type='button' 
                    className='w-full sm:flex-1 py-3 px-8 border border-primary hover:border-secondary hover:bg-secondary text-primary hover:text-white font-medium'
                >
                    <Link href={'/cart'} className="flex items-center justify-center gap-2">
                        {tc('back') || tc('previous')}
                    </Link>
                </CustomButton>
            </div>

           
        </div>
    );
};
