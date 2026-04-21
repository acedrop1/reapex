import { z } from 'zod';

/**
 * Listing Validation Schemas
 * Zod schemas for listings table matching actual database schema
 */

// Enums
export const PropertyTypeEnum = z.enum([
  'apartment',
  'single_family_home',
  'condo',
  'villa',
  'office',
  'shop',
  'studio',
  'townhouse',
  'penthouse',
  'duplex',
  'warehouse',
  'commercial_building',
  'retail',
  'multi_family',
  'business',
  'commercial',
  'mixed_use',
]);

export const ListingTypeEnum = z.enum(['for_sale', 'for_rent']);

export const ListingStatusEnum = z.enum(['draft', 'active', 'pending', 'sold', 'rented', 'archived']);

// Property Features Schema (JSONB)
export const PropertyFeaturesSchema = z.object({
  // Appliances
  laundry: z.enum(['In-unit', 'Shared', 'None']).optional(),
  dishwasher: z.boolean().optional(),
  refrigerator: z.boolean().optional(),
  microwave: z.boolean().optional(),
  oven: z.boolean().optional(),
  washer: z.boolean().optional(),
  dryer: z.boolean().optional(),

  // Outdoor
  lawn: z.boolean().optional(),
  garden: z.boolean().optional(),
  patio: z.boolean().optional(),
  balcony: z.boolean().optional(),
  deck: z.boolean().optional(),

  // Parking
  parking: z.enum(['Garage', 'Driveway', 'Street', 'Covered', 'None']).optional(),
  garageSpaces: z.number().int().min(0).optional(),

  // Amenities
  pool: z.boolean().optional(),
  gym: z.boolean().optional(),
  spa: z.boolean().optional(),
  elevator: z.boolean().optional(),

  // Climate Control
  airConditioning: z.boolean().optional(),
  heating: z.enum(['Central', 'Electric', 'Gas', 'None']).optional(),
  fireplace: z.boolean().optional(),

  // Other
  petFriendly: z.boolean().optional(),
  furnished: z.boolean().optional(),
  storage: z.boolean().optional(),
  security: z.boolean().optional(),
  gatedCommunity: z.boolean().optional(),

  // Utilities Included
  utilities: z.array(z.enum(['Water', 'Trash', 'Sewer', 'Gas', 'Electric', 'Internet', 'Cable'])).optional(),

  // Additional amenities
  amenities: z.array(z.string()).optional(),
}).passthrough(); // Allow additional properties

// Base Listing Schema matching actual database
export const ListingSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),

  // Property Details
  property_type: PropertyTypeEnum,
  listing_type: ListingTypeEnum,

  // Location
  property_address: z.string().min(5).max(500),
  property_city: z.string().min(2).max(100),
  property_state: z.string().min(2).max(100),
  property_zip: z.string().min(3).max(20),

  // Pricing
  price: z.number().positive(),
  price_period: z.string().optional().nullable(), // e.g., 'month', 'year' for rentals

  // Property Features
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),
  garages: z.number().int().min(0).max(20).optional().nullable(),
  square_feet: z.number().positive().optional().nullable(),

  // Description
  description: z.string().max(5000).optional().nullable(),

  // SEO & URL
  listing_title: z.string().min(1).max(200).optional().nullable(),
  slug: z.string().min(1).max(100).optional().nullable(),

  // Media
  images: z.array(z.string().url()).default([]).nullable(),
  cover_image: z.string().url().optional().nullable(),

  // Features (JSONB)
  features: PropertyFeaturesSchema.optional().nullable(),

  // Status & Flags
  status: ListingStatusEnum.default('active').nullable(),
  featured: z.boolean().default(false).nullable(),
  open_house: z.boolean().default(false).nullable(),

  // MLS/Reference
  mls_number: z.string().optional().nullable(),

  // External Link
  listing_url: z.string().url().optional().nullable(),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Create Listing (for API inputs)
export const CreateListingSchema = ListingSchema.omit({
  id: true,
  slug: true, // Auto-generated, not user-provided
  created_at: true,
  updated_at: true,
}).partial({
  status: true,
  featured: true,
  open_house: true,
  images: true,
  cover_image: true,
  features: true,
  listing_url: true,
  listing_title: true, // Optional custom title
  price_period: true,
  bedrooms: true,
  bathrooms: true,
  garages: true,
  square_feet: true,
  description: true,
  mls_number: true,
});

// Update Listing (all fields optional except id)
export const UpdateListingSchema = ListingSchema.partial().required({ id: true });

// Listing Filters
export const ListingFiltersSchema = z.object({
  agent_id: z.string().uuid().optional(),
  property_type: PropertyTypeEnum.optional(),
  listing_type: ListingTypeEnum.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: ListingStatusEnum.optional(),
  featured: z.boolean().optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  min_bedrooms: z.number().int().min(0).optional(),
  max_bedrooms: z.number().int().min(0).optional(),
  min_bathrooms: z.number().int().min(0).optional(),
  max_bathrooms: z.number().int().min(0).optional(),
  min_square_feet: z.number().positive().optional(),
  max_square_feet: z.number().positive().optional(),
  search: z.string().optional(), // Full-text search
});

// Export types
export type Listing = z.infer<typeof ListingSchema>;
export type CreateListing = z.infer<typeof CreateListingSchema>;
export type UpdateListing = z.infer<typeof UpdateListingSchema>;
export type ListingFilters = z.infer<typeof ListingFiltersSchema>;
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
export type ListingType = z.infer<typeof ListingTypeEnum>;
export type ListingStatus = z.infer<typeof ListingStatusEnum>;
export type PropertyFeatures = z.infer<typeof PropertyFeaturesSchema>;
