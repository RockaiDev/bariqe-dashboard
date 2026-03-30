"use client";

import { MapPin, Home, Building, Search, Loader2 } from 'lucide-react';
import { Control, UseFormSetValue, useWatch } from "react-hook-form"
import { useTranslations } from 'next-intl';
import { CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';
import { CheckoutInput } from '../CheckoutInput';
import { Button } from '@/shared/components/ui/button';
import { useNationalAddress } from '@/shared/hooks/useNationalAddress';

interface DeliveryAddressSectionProps {
    control: Control<CheckoutFormValues>;
    setValue: UseFormSetValue<CheckoutFormValues>;
}

export const DeliveryAddressSection = ({ control, setValue }: DeliveryAddressSectionProps) => {
    const t = useTranslations('checkout');
    const { searchAddress, isLoading } = useNationalAddress();

    // Watch the national address field
    const nationalAddressValue = useWatch({
        control,
        name: 'nationalAddress',
    });

    const handleSearch = async () => {
        if (!nationalAddressValue) return;

        const result = await searchAddress(nationalAddressValue);
        
        if (result && result.address) {
            const { city, county, district, street, houseNumber } = result.address;
            if (county) setValue('region', county);
            if (city) setValue('city', city);
            if (district) setValue('neighborhood', district);
            if (street) setValue('street', street);
            if (houseNumber) setValue('blockNumber', houseNumber);
        }
    };

    return (
        <div className='space-y-4 pt-2'>
            <h3 className='text-base font-semibold text-primary flex items-center justify-between pb-2 border-b'>
                <div className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    {t('deliveryAddress') || 'Delivery Address'}
                </div>
            </h3>

            {/* National Address Search */}
            {/* <div className='flex items-end gap-2'>
                <div className='flex-1'>
                    <CheckoutInput
                        control={control}
                        name="nationalAddress"
                        labelKey="placeholders.nationalAddress"
                        placeholderKey="placeholders.nationalAddress"
                        icon={Search}
                        className="w-full"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className='mb-[2px] h-10'
                    onClick={handleSearch}
                    disabled={isLoading || !nationalAddressValue}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className='ms-2 hidden md:inline'>{t('buttons.search') || 'Search'}</span>
                </Button>
            </div> */}

            {/* Region and City */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <CheckoutInput
                    control={control}
                    name="region"
                    labelKey="placeholders.region"
                    placeholderKey="placeholders.region"
                    icon={MapPin}
                    required
                    autoComplete="address-level1"
                />
                <CheckoutInput
                    control={control}
                    name="city"
                    labelKey="placeholders.city"
                    placeholderKey="placeholders.city"
                    icon={Building}
                    required
                    autoComplete="address-level2"
                />
            </div>

            {/* Neighborhood */}
            <CheckoutInput
                control={control}
                name="neighborhood"
                labelKey="placeholders.neighborhood"
                placeholderKey="placeholders.neighborhood"
                icon={Home}
                autoComplete="address-level3"
            />

            {/* Street and Block/Floor Row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <CheckoutInput
                    control={control}
                    name="street"
                    labelKey="placeholders.street"
                    placeholderKey="placeholders.street"
                    required
                    autoComplete="street-address"
                    className="md:col-span-1"
                />
                <CheckoutInput
                    control={control}
                    name="floor"
                    labelKey="placeholders.floor"
                    placeholderKey="placeholders.floor"
                />
                <CheckoutInput
                    control={control}
                    name="blockNumber"
                    labelKey="placeholders.blockNumber"
                    placeholderKey="placeholders.blockNumber"
                />
            </div>
        </div>
    );
};
