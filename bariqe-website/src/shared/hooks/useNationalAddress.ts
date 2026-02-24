import { useState } from 'react';
import { geocodeAddress, HereGeocodeItem } from '@/lib/services/hereService';
import { toast } from 'react-hot-toast';
import { useLocale, useTranslations } from 'next-intl';

export const useNationalAddress = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [addressData, setAddressData] = useState<HereGeocodeItem | null>(null);
    const t = useTranslations('checkout');
    const locale = useLocale();

    const searchAddress = async (query: string) => {
        if (!query || query.length < 4) return null;

        setIsLoading(true);
        try {
            const items = await geocodeAddress(query, locale);
            if (items && items.length > 0) {
                const item = items[0];
                setAddressData(item);
                return item;
            } else {
                toast.error(t('errors.invalidNationalAddress') || 'Invalid National Address');
                setAddressData(null);
                return null;
            }
        } catch (error) {
            toast.error(t('errors.addressSearchFailed') || 'Address search failed');
            setAddressData(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        searchAddress,
        isLoading,
        addressData,
        setAddressData,
    };
};
