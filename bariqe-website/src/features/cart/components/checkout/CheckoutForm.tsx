"use client";

import React from 'react'
import { Card } from '@/shared/components/ui/card';
import { Truck } from 'lucide-react';
import { FieldGroup } from "@/shared/components/ui/field"
import { useCart } from '@/shared/hooks/useCart';
import { useTranslations } from 'next-intl';
import FadeUpReval from '@/shared/animations/FadUpReval';
import { ContactInfoSection } from './sections/ContactInfoSection';
import { DeliveryAddressSection } from './sections/DeliveryAddressSection';
import { CheckoutActions } from './CheckoutActions';
import { OrderSummary } from './OrderSummary';
import { useCheckoutForm } from './hooks/useCheckoutForm';

export const CheckoutForm = () => {
    const t = useTranslations('checkout');
    const { items, total } = useCart();
    const { form, isSubmitting, onSubmit } = useCheckoutForm();

    return (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 my-5'>
            {/* Main Form Section */}
            <FadeUpReval className='lg:col-span-2'>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.log("Validation Errors:", errors);
                    // Dynamically import toast to avoid server-side issues if any, though here it's client comp
                    const { toast } = require('react-hot-toast');
                    toast.error(t('validation.fillAllFields'));
                })} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className='text-primary font-semibold text-lg md:text-xl flex items-center gap-2'>
                            <Truck className="w-5 h-5" />
                            {t('steps.address')}
                        </h2>
                    </div>

                    <Card className="p-5 md:p-6 space-y-6">
                        <FieldGroup className='w-full space-y-5'>
                            {/* Contact Information Section */}
                            <ContactInfoSection control={form.control} />

                            {/* Delivery Address Section */}
                            <DeliveryAddressSection control={form.control} setValue={form.setValue} />
                        </FieldGroup>
                    </Card>

                    {/* Action Buttons */}
                    <CheckoutActions isSubmitting={isSubmitting} />
                </form>
            </FadeUpReval>

            {/* Order Summary Sidebar */}
            <OrderSummary items={items} total={total} />
        </div>
    );
}

