import axios from 'axios';

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const BASE_URL = 'https://geocode.search.hereapi.com/v1/geocode';

export interface HereAddress {
    label: string;
    countryCode: string;
    countryName: string;
    county: string;
    city: string;
    district: string;
    street: string;
    postalCode: string;
    houseNumber: string;
    building: string;
}

export interface HerePosition {
    lat: number;
    lng: number;
}

export interface HereGeocodeItem {
    title: string;
    id: string;
    resultType: string;
    address: HereAddress;
    position: HerePosition;
}

export interface HereGeocodeResponse {
    items: HereGeocodeItem[];
}

/**
 * Searches for an address using HERE Geocoding API.
 * We use a clean axios instance to avoid sending internal app headers (like Auth) 
 * to external APIs, which typically causes CORS issues.
 */
export const geocodeAddress = async (query: string, lang: string = 'ar'): Promise<HereGeocodeItem[]> => {
    try {
        const response = await axios.get<HereGeocodeResponse>(BASE_URL, {
            params: {
                q: query,
                apiKey: HERE_API_KEY,
                lang: lang === 'ar' ? 'ar-SA' : 'en-US',
            },
        });

        return response.data.items || [];
    } catch (error) {
        console.error('HERE Geocode Error:', error);
        throw error;
    }
};
