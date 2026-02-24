import { useState, useEffect, useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import { LocationData } from '@/shared/types/location';

interface UseLocationReturn {
  countries: Array<{ isoCode: string; name: string; flag: string }>;
  states: Array<{ isoCode: string; name: string; countryCode: string }>;
  cities: Array<{ name: string; stateCode: string; countryCode: string }>;
  getLocationString: () => string;
  getLocationCodeString: () => string;
}

export function useLocation(locationData: LocationData): UseLocationReturn {
  // Get all countries (memoized to avoid recalculation)
  const countries = useMemo(() => {
    return Country.getAllCountries().map(country => ({
      isoCode: country.isoCode,
      name: country.name,
      flag: country.flag,
    }));
  }, []);

  // Get states for selected country
  const states = useMemo(() => {
    if (!locationData.countryCode) return [];
    
    return State.getStatesOfCountry(locationData.countryCode).map(state => ({
      isoCode: state.isoCode,
      name: state.name,
      countryCode: state.countryCode,
    }));
  }, [locationData.countryCode]);

  // Get cities for selected state
  const cities = useMemo(() => {
    if (!locationData.countryCode || !locationData.stateCode) return [];
    
    return City.getCitiesOfState(locationData.countryCode, locationData.stateCode).map(city => ({
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
    }));
  }, [locationData.countryCode, locationData.stateCode]);

  // Get formatted location string
  const getLocationString = () => {
    if (!locationData.city) return '';
    
    const parts = [];
    if (locationData.city) parts.push(locationData.city);
    if (locationData.state) parts.push(locationData.state);
    if (locationData.country) parts.push(locationData.country);
    
    return parts.join(', ');
  };

  // Get formatted location code string
  const getLocationCodeString = () => {
    if (!locationData.city) return '';
    
    const parts = [];
    if (locationData.city) parts.push(locationData.city);
    if (locationData.stateCode) parts.push(locationData.stateCode);
    if (locationData.countryCode) parts.push(locationData.countryCode);
    
    return parts.join(', ');
  };

  return {
    countries,
    states,
    cities,
    getLocationString,
    getLocationCodeString,
  };
}
