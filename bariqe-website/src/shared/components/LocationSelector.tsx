import { useEffect } from 'react';
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useLocation } from '@/shared/hooks/useLocation';
import { LocationSelectorProps, LocationData } from '@/shared/types/location';

const defaultLabels = {
  country: "Country",
  state: "State",
  city: "City",
  selectedLocation: "Selected Location:",
  locationCode: "Location Code:",
};

const defaultPlaceholders = {
  country: "Select Country",
  state: "Select State",
  city: "Select City",
};

export function LocationSelector({
  locationData,
  setLocationData,
  onLocationChange,
  fieldPrefix = "location",
  disabled = false,
  required = false,
  labels = {},
  placeholders = {},
}: LocationSelectorProps) {
  const {
    countries,
    states,
    cities,
    getLocationString,
    getLocationCodeString,
  } = useLocation(locationData);

  // Debug: Log when states or cities change
  // useEffect(() => {
    console.log('LocationSelector - Current locationData:', locationData);
    console.log('LocationSelector - Available states:', states);
    console.log('LocationSelector - Available cities:', cities);
  // }, [locationData, states, cities]);

  // Call onLocationChange when location changes
  useEffect(() => {
    if (onLocationChange) {
      const locationString = getLocationString();
      if (locationString) {
        onLocationChange(locationString);
      }
    }
  }, [locationData.city, locationData.state, locationData.country]);

  const mergedLabels = { ...defaultLabels, ...labels };
  const mergedPlaceholders = { ...defaultPlaceholders, ...placeholders };

  return (
    <div className="space-y-4">
      {/* Responsive Grid - stacks on mobile, 2 columns on tablet, 3 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Country Select */}
        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-country`} className="text-white">
            {mergedLabels.country}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Select
            value={locationData.countryCode}
            onValueChange={(value) => {
              // console.log('Selected country code:', value);
              const country = countries.find(c => c.isoCode === value);
              // console.log('Found country:', country);
              
              if (country) {
                const newLocationData: LocationData = {
                  country: country.name,
                  countryCode: country.isoCode,
                  state: "",
                  stateCode: "",
                  city: "",
                };
                // console.log('Setting new location data:', newLocationData);
                setLocationData(newLocationData);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger 
              id={`${fieldPrefix}-country`}
              className="bg-white text-navy border-gray-300 w-full"
            >
              <SelectValue placeholder={mergedPlaceholders.country} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto bg-white">
              {countries.map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State Select */}
        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-state`} className="text-white">
            {mergedLabels.state}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Select
            value={locationData.stateCode}
            onValueChange={(value) => {
              // console.log('Selected state code:', value);
              const state = states.find(s => s.isoCode === value);
              // console.log('Found state:', state);
              
              if (state) {
                const newLocationData: LocationData = {
                  ...locationData,
                  state: state.name,
                  stateCode: state.isoCode,
                  city: "",
                };
                // console.log('Setting new location data:', newLocationData);
                setLocationData(newLocationData);
              }
            }}
            disabled={disabled || !locationData.countryCode || states.length === 0}
          >
            <SelectTrigger 
              id={`${fieldPrefix}-state`}
              className="bg-white text-navy border-gray-300 w-full"
            >
              <SelectValue placeholder={mergedPlaceholders.state} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto bg-white">
              {states.length > 0 ? (
                states.map((state) => (
                  <SelectItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 text-center">
                  {locationData.countryCode ? 'No states available' : 'Please select a country first'}
                </div>
              )}
            </SelectContent>
          </Select>
          {locationData.countryCode && states.length === 0 && (
            <p className="text-xs text-yellow-400">
              No states found for this country
            </p>
          )}
        </div>

        {/* City Select */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label htmlFor={`${fieldPrefix}-city`} className="text-white">
            {mergedLabels.city}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Select
            value={locationData.city}
            onValueChange={(value) => {
              // console.log('Selected city:', value);
              const newLocationData: LocationData = {
                ...locationData,
                city: value,
              };
              // console.log('Setting new location data:', newLocationData);
              setLocationData(newLocationData);
            }}
            disabled={disabled || !locationData.stateCode || cities.length === 0}
          >
            <SelectTrigger 
              id={`${fieldPrefix}-city`}
              className="bg-white text-navy border-gray-300 w-full"
            >
              <SelectValue placeholder={mergedPlaceholders.city} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto bg-white">
              {cities.length > 0 ? (
                cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 text-center">
                  {locationData.stateCode ? 'No cities available' : 'Please select a state first'}
                </div>
              )}
            </SelectContent>
          </Select>
          {locationData.stateCode && cities.length === 0 && (
            <p className="text-xs text-yellow-400">
              No cities found for this state
            </p>
          )}
        </div>
      </div>

      {/* Selected Location Display */}
      {locationData.city && (
        <div className="p-3 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-white">
            <strong className="text-blue-400">{mergedLabels.selectedLocation}</strong>{' '}
            {getLocationString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <strong className="text-blue-400">{mergedLabels.locationCode}</strong>{' '}
            {getLocationCodeString()}
          </p>
        </div>
      )}
    </div>
  );
}
