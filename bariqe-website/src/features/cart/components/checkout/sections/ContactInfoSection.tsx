"use client";

import { User, Mail, Phone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  FieldLabel,
} from "@/shared/components/ui/field"
import { Controller, Control, useWatch } from "react-hook-form"
import { useTranslations } from 'next-intl';
import { CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';
import { CheckoutInput } from '../CheckoutInput';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldError } from '@/shared/components/ui/field';
import {
    COUNTRY_PHONE_OPTIONS,
    normalizeLocalPhoneInput,
} from '@/features/cart/lib/phone';

interface ContactInfoSectionProps {
  control: Control<CheckoutFormValues>;
}

export const ContactInfoSection = ({ control }: ContactInfoSectionProps) => {
    const t = useTranslations('checkout');
    const countryCode = useWatch({ control, name: 'countryCode' });

    return (
        <div className='space-y-4'>
            <h3 className='text-base font-semibold text-primary flex items-center gap-2 pb-2 border-b'>
                <User className='w-5 h-5' />
                {t('fields.contactInfo') || 'Contact Information'}
            </h3>

            {/* Name and Phone Row */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <CheckoutInput
                    control={control}
                    name="name"
                    labelKey="fields.fullName"
                    placeholderKey="placeholders.fullName"
                    icon={User}
                    required
                    autoComplete="name"
                />

                <div>
                    <FieldLabel className='font-medium flex items-center gap-2 text-sm'>
                        <Phone className='w-4 h-4 text-primary' />
                        {t('fields.phoneNumber')} <span className='text-destructive'>*</span>
                    </FieldLabel>
                    <div className='flex gap-2 mt-2'>
                        <Controller
                            name="countryCode"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="w-[100px] py-5 focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_PHONE_OPTIONS.map((item) => (
                                            <SelectItem key={item.code} value={item.code}>
                                                {item.flag} {item.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className='flex-1'>
                                    <Input
                                        className={cn('py-5 transition-all focus:ring-2 focus:ring-primary/20', fieldState.invalid && 'border-destructive focus:ring-destructive/20')}
                                        {...field}
                                        id="phoneNumber"
                                        placeholder={t('placeholders.phoneNumber')}
                                        autoComplete="tel"
                                        type='tel'
                                        onChange={(e) => {
                                            field.onChange(
                                                normalizeLocalPhoneInput(e.target.value, countryCode)
                                            );
                                        }}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Email */}
            <CheckoutInput
                control={control}
                name="email"
                labelKey="fields.emailAddress"
                placeholderKey="placeholders.emailAddress"
                icon={Mail}

                type="email"
                autoComplete="email"
            />
        </div>
    );
};
