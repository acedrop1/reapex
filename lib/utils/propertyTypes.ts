/**
 * Property Type Label Utilities
 * Provides consistent Title Case formatting for property types across the application
 */

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  // Residential
  house: 'House',
  single_family_home: 'Single Family Home',
  townhome: 'Townhome',
  condo: 'Condo',
  apartment: 'Apartment',
  villa: 'Villa',
  studio: 'Studio',
  multi_family: 'Multi-Family',

  // Commercial
  commercial: 'Commercial',
  office: 'Office',
  shop: 'Shop',
  retail: 'Retail',
  warehouse: 'Warehouse',
  business: 'Business',
  mixed_use: 'Mixed-Use',
  commercial_building: 'Commercial Building',

  // Land
  land: 'Land',
  lot: 'Lot',
};

/**
 * Convert property type to Title Case display label
 * Falls back to converting snake_case to Title Case if not in mapping
 */
export function getPropertyTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Property';

  // Check if we have a predefined label
  if (PROPERTY_TYPE_LABELS[type]) {
    return PROPERTY_TYPE_LABELS[type];
  }

  // Fallback: Convert snake_case to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get plural form of property type label (for listings pages)
 */
export function getPropertyTypeLabelPlural(type: string | null | undefined): string {
  const singular = getPropertyTypeLabel(type);

  // Special cases for plural forms
  const pluralOverrides: Record<string, string> = {
    'House': 'Houses',
    'Townhome': 'Townhomes',
    'Condo': 'Condos',
    'Apartment': 'Apartments',
    'Villa': 'Villas',
    'Studio': 'Studios',
    'Office': 'Offices',
    'Shop': 'Shops',
    'Multi-Family': 'Multi-Family Properties',
    'Commercial': 'Commercial Properties',
    'Business': 'Businesses',
    'Mixed-Use': 'Mixed-Use Properties',
    'Commercial Building': 'Commercial Buildings',
  };

  return pluralOverrides[singular] || singular;
}
