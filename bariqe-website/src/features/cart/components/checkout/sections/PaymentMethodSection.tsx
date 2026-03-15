"use client";

import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { CreditCard, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';

interface PaymentMethodSectionProps {
    control: Control<CheckoutFormValues>;
}

export const PaymentMethodSection = ({ control }: PaymentMethodSectionProps) => {
    const t = useTranslations('checkout');

    const options = [
        {
            value: 'cod' as const,
            label: t('payment.cashOnDelivery'),
            icon: Banknote,
            description: t('deliveryNotice'),
        },
        {
            value: 'paylink' as const,
            label: t('payment.creditCard'),
            icon: CreditCard,
        },
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('steps.payment')}</h3>
            <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                    <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-3"
                    >
                        {options.map((option) => {
                            const Icon = option.icon;
                            const isSelected = field.value === option.value;
                            return (
                                <Label
                                    key={option.value}
                                    htmlFor={`payment-${option.value}`}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <RadioGroupItem
                                        value={option.value}
                                        id={`payment-${option.value}`}
                                    />
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        isSelected ? "text-primary" : "text-gray-400"
                                    )} />
                                    <div className="flex-1">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            isSelected ? "text-primary" : "text-gray-700"
                                        )}>
                                            {option.label}
                                        </span>
                                        {option.description && isSelected && (
                                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                                        )}
                                    </div>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                )}
            />
        </div>
    );
};
