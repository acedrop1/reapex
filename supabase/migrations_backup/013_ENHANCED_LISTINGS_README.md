# Enhanced Listings Schema - Migration 013

## Overview
This migration enhances the listings table with support for multi-photo listings, cover images, JSONB features, and external listing URLs.

## New Fields Added

### 1. `cover_image` (text, nullable)
- **Purpose**: Primary/hero image for the listing
- **Usage**: URL to the cover/primary image that should be displayed prominently
- **Example**: `https://example.com/images/property-hero.jpg`
- **Notes**: If null, you can use the first image from the `images` array

### 2. `features` (jsonb, default '{}')
- **Purpose**: Flexible property features and amenities storage
- **Usage**: Store structured property features like laundry, lawn, parking, etc.
- **Indexed**: GIN index for fast querying
- **Schema Structure**:

```json
{
  "laundry": "In-unit",
  "parking": "Garage",
  "lawn": true,
  "pool": true,
  "gym": false,
  "petFriendly": true,
  "furnished": false,
  "airConditioning": true,
  "heating": "Central",
  "dishwasher": true,
  "refrigerator": true,
  "microwave": true,
  "oven": true,
  "washer": true,
  "dryer": true,
  "garden": false,
  "patio": true,
  "balcony": true,
  "deck": false,
  "garageSpaces": 2,
  "spa": false,
  "elevator": true,
  "fireplace": false,
  "storage": true,
  "security": true,
  "gatedCommunity": true,
  "utilities": ["Water", "Trash", "Sewer"],
  "amenities": ["Balcony", "Storage Unit", "Bike Storage"]
}
```

### 3. `listing_url` (text, nullable)
- **Purpose**: External URL to the full listing page
- **Usage**: Link to the property listing on your website or third-party site
- **Example**: `https://re-apex.com/listings/123e4567-e89b-12d3-a456-426614174000`
- **Notes**: Useful for linking to detailed listing pages or external MLS sites

### 4. `mls_number` (text, unique, nullable)
- **Purpose**: Multiple Listing Service reference number
- **Usage**: MLS # for the property (replaces `property_reference`)
- **Example**: `MLS12345678`
- **Notes**: Unique constraint ensures no duplicate MLS numbers

## Migration Details

### Changes Made
1. ✅ Added `cover_image` column
2. ✅ Added `features` JSONB column with default `{}`
3. ✅ Added `listing_url` column
4. ✅ Added `mls_number` column
5. ✅ Migrated data from `property_reference` to `mls_number`
6. ✅ Dropped `property_reference` column and its constraint
7. ✅ Added unique constraint to `mls_number`
8. ✅ Created indexes for performance

### Indexes Created
- `idx_listings_cover_image` - BTree index for cover image queries
- `idx_listings_features` - GIN index for JSONB features queries

## Usage Examples

### Inserting a New Listing
```sql
INSERT INTO listings (
  agent_id,
  property_type,
  listing_type,
  property_address,
  property_city,
  property_state,
  property_zip,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  description,
  images,
  cover_image,
  features,
  listing_url,
  mls_number,
  featured,
  status
) VALUES (
  'agent-uuid-here',
  'apartment',
  'for_sale',
  '123 Main St',
  'Fort Lee',
  'NJ',
  '07024',
  450000.00,
  2,
  2,
  1200,
  'Beautiful 2BR/2BA apartment with amazing views',
  ARRAY['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
  'https://example.com/cover.jpg',
  '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": false,
    "pool": true,
    "gym": true,
    "petFriendly": true,
    "airConditioning": true,
    "heating": "Central",
    "balcony": true,
    "garageSpaces": 1,
    "utilities": ["Water", "Trash"],
    "amenities": ["Gym", "Pool", "Concierge"]
  }'::jsonb,
  'https://re-apex.com/listings/new-listing-123',
  'MLS12345678',
  true,
  'active'
);
```

### Querying Features
```sql
-- Find all listings with a pool
SELECT * FROM listings
WHERE features->>'pool' = 'true';

-- Find listings with in-unit laundry
SELECT * FROM listings
WHERE features->>'laundry' = 'In-unit';

-- Find listings with garage parking
SELECT * FROM listings
WHERE features->>'parking' = 'Garage';

-- Find pet-friendly listings
SELECT * FROM listings
WHERE features->>'petFriendly' = 'true';

-- Find listings with specific utilities included
SELECT * FROM listings
WHERE features->'utilities' ? 'Water';

-- Find listings with specific amenities
SELECT * FROM listings
WHERE features->'amenities' @> '["Gym"]'::jsonb;
```

### Updating Features
```sql
-- Update specific feature
UPDATE listings
SET features = jsonb_set(features, '{pool}', 'true'::jsonb)
WHERE id = 'listing-uuid-here';

-- Add new feature
UPDATE listings
SET features = features || '{"sauna": true}'::jsonb
WHERE id = 'listing-uuid-here';

-- Update multiple features
UPDATE listings
SET features = features || '{
  "pool": true,
  "gym": true,
  "petFriendly": false
}'::jsonb
WHERE id = 'listing-uuid-here';
```

## TypeScript/JavaScript Usage

### Using with TypeScript
```typescript
import { Listing, PropertyFeatures } from '@/lib/schemas/listing.schema';

// Create a listing with features
const newListing: CreateListing = {
  agent_id: 'agent-uuid',
  property_type: 'apartment',
  listing_type: 'for_sale',
  property_address: '123 Main St',
  property_city: 'Fort Lee',
  property_state: 'NJ',
  property_zip: '07024',
  price: 450000,
  bedrooms: 2,
  bathrooms: 2,
  square_feet: 1200,
  description: 'Beautiful apartment',
  images: ['url1.jpg', 'url2.jpg'],
  cover_image: 'cover.jpg',
  features: {
    laundry: 'In-unit',
    parking: 'Garage',
    pool: true,
    gym: true,
    petFriendly: true,
    airConditioning: true,
    heating: 'Central',
    utilities: ['Water', 'Trash'],
    amenities: ['Gym', 'Pool']
  },
  listing_url: 'https://re-apex.com/listings/123',
  mls_number: 'MLS12345678',
  featured: true,
  status: 'active'
};

// Query with Supabase
const { data } = await supabase
  .from('listings')
  .select('*')
  .eq('features->>pool', true)
  .eq('features->>gym', true);
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Recreate property_reference column
ALTER TABLE public.listings
  ADD COLUMN property_reference text;

-- Migrate data back
UPDATE public.listings
SET property_reference = mls_number
WHERE mls_number IS NOT NULL;

-- Add back the unique constraint
ALTER TABLE public.listings
  ADD CONSTRAINT listings_property_reference_key UNIQUE (property_reference);

-- Drop new columns
ALTER TABLE public.listings
  DROP COLUMN IF EXISTS cover_image,
  DROP COLUMN IF EXISTS features,
  DROP COLUMN IF EXISTS listing_url,
  DROP COLUMN IF EXISTS mls_number;

-- Drop indexes
DROP INDEX IF EXISTS idx_listings_cover_image;
DROP INDEX IF EXISTS idx_listings_features;
```

## Notes
- The `features` JSONB field is flexible and can contain any additional properties not covered by the schema
- Always validate JSONB data on the application layer using Zod schemas
- Use GIN indexes for complex JSONB queries
- The `cover_image` is optional; fallback to `images[0]` if not set
- `mls_number` has a unique constraint to prevent duplicate entries
