"use client";

import { useTranslations } from 'next-intl';
import { Card } from '@/shared/components/ui/card';
import { SquarePen } from 'lucide-react';

interface PreviewCardProps {
    children: React.ReactNode;
    title: string;
    changeData: () => void;
}

export const PreviewCard = ({ children, changeData, title }: PreviewCardProps) => {
    const t = useTranslations('checkout');
    // const { items, total } = useCart(); // Unused in original
    // const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0); // Unused in original
    return (
        <Card className='px-8 rounded-sm'>
            <div className='w-full flex items-center justify-between gap-3'>
                <h5 className='text-text-tertiary text-sm sm:text-lg font-medium'>{title}</h5>
                <button type="button" onClick={changeData} className='text-text-secondary text-xs sm:text-sm flex items-center justify-center gap-2'>
                    <SquarePen className='w-5 h-5' />
                    <p className='underline'>{t('buttons.reviewOrder')}</p>
                </button>
            </div>
            {children}
        </Card>
    )
}
