export interface LocationData {
  country: string;
  state: string;
  city: string;
  countryCode: string;
  stateCode: string;
}

export interface LocationSelectorProps {
  locationData: LocationData;
  setLocationData: (data: LocationData) => void;
  onLocationChange?: (locationString: string) => void;
  fieldPrefix?: string;
  disabled?: boolean;
  required?: boolean;
  labels?: {
    country?: string;
    state?: string;
    city?: string;
    selectedLocation?: string;
    locationCode?: string;
  };
  placeholders?: {
    country?: string;
    state?: string;
    city?: string;
  };
}
