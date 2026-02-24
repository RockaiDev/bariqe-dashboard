"use client";

import { useTranslations } from 'next-intl';
import { Control, Controller, FieldPath } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';
import { CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';
import {
    Field,
    FieldError,
    FieldLabel,
} from "@/shared/components/ui/field"
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/lib/utils';

interface CheckoutInputProps {
    control: Control<CheckoutFormValues>;
    name: FieldPath<CheckoutFormValues>;
    labelKey: string;
    placeholderKey: string;
    icon?: LucideIcon;
    required?: boolean;
    type?: string;
    autoComplete?: string;
    className?: string;
    inputClassName?: string;
    numericOnly?: boolean;
}

export const CheckoutInput = ({
    control,
    name,
    labelKey,
    placeholderKey,
    icon: Icon,
    required = false,
    type = 'text',
    autoComplete,
    className,
    inputClassName,
    numericOnly = false
}: CheckoutInputProps) => {
    const t = useTranslations('checkout');

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className={className}>
                    <FieldLabel className='font-medium flex items-center gap-2 text-sm'>
                        {Icon && <Icon className='w-4 h-4 text-primary' />}
                        {t(labelKey)} {required && <span className='text-destructive'>*</span>}
                    </FieldLabel>
                    <Input
                        className={cn('py-5 transition-all focus:ring-2 focus:ring-primary/20', inputClassName, fieldState.invalid && 'border-destructive focus:ring-destructive/20')}
                        {...field}
                        id={name}
                        value={field.value ?? ''}
                        type={type}
                        placeholder={t(placeholderKey)}
                        autoComplete={autoComplete}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                            if (numericOnly) {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value);
                            } else {
                                field.onChange(e);
                            }
                        }}
                    />
                    {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                    )}
                </Field>
            )}
        />
    );
};
