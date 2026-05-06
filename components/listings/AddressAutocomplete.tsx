'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TextField, Box, Paper, Typography, CircularProgress } from '@mui/material';
import { MapPin } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface AddressResult {
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (result: AddressResult) => void;
  sx?: any;
  required?: boolean;
  disabled?: boolean;
}

// Load Google Maps script once
let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded && window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not set — address autocomplete disabled');
      reject(new Error('No API key'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => {
      googleMapsLoadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// Parse address components from Google Place result
function parsePlace(place: google.maps.places.PlaceResult): AddressResult {
  const components = place.address_components || [];
  let streetNumber = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';

  for (const comp of components) {
    const types = comp.types;
    if (types.includes('street_number')) {
      streetNumber = comp.long_name;
    } else if (types.includes('route')) {
      route = comp.long_name;
    } else if (types.includes('locality')) {
      city = comp.long_name;
    } else if (types.includes('sublocality_level_1') && !city) {
      city = comp.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = comp.short_name;
    } else if (types.includes('postal_code')) {
      zip = comp.long_name;
    }
  }

  const address = streetNumber && route ? `${streetNumber} ${route}` : route || place.formatted_address?.split(',')[0] || '';

  return {
    property_address: address,
    property_city: city,
    property_state: state || 'NJ',
    property_zip: zip,
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  sx,
  required = false,
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load Google Maps on mount
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setApiReady(true))
      .catch(() => setApiError(true));
  }, []);

  // Initialize autocomplete when API is ready
  useEffect(() => {
    if (!apiReady || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address', 'geometry'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.address_components) {
        const parsed = parsePlace(place);
        onAddressSelect(parsed);
        onChange(parsed.property_address);
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [apiReady]);

  return (
    <TextField
      fullWidth
      label="Property Address"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      inputRef={inputRef}
      placeholder={apiReady ? 'Start typing an address...' : 'Enter address'}
      helperText={apiError ? undefined : (apiReady ? 'Powered by Google — start typing to see suggestions' : undefined)}
      FormHelperTextProps={{ sx: { color: '#666' } }}
      InputProps={{
        startAdornment: (
          <MapPin size={18} color="#666" style={{ marginRight: 8, flexShrink: 0 }} />
        ),
      }}
      sx={sx || dashboardStyles.textField}
    />
  );
}
