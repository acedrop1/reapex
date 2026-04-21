-- Migration: Enhance listings schema with cover image, features, and listing URL
-- Created: 2025-01-12

-- Add new columns to listings table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS listing_url text,
  ADD COLUMN IF NOT EXISTS mls_number text;

-- Migrate existing property_reference to mls_number if data exists (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'property_reference'
  ) THEN
    UPDATE public.listings
    SET mls_number = property_reference
    WHERE property_reference IS NOT NULL AND mls_number IS NULL;

    -- Drop the old property_reference column and its unique constraint
    ALTER TABLE public.listings
      DROP CONSTRAINT IF EXISTS listings_property_reference_key;

    ALTER TABLE public.listings
      DROP COLUMN IF EXISTS property_reference;
  END IF;
END $$;

-- Add unique constraint to mls_number (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_mls_number_key'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_mls_number_key UNIQUE (mls_number);
  END IF;
END $$;

-- Create index for cover_image for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_cover_image
  ON public.listings USING btree (cover_image)
  WHERE cover_image IS NOT NULL;

-- Create GIN index for features JSONB column for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_features
  ON public.listings USING gin (features);

-- Add comments to document the new columns
COMMENT ON COLUMN public.listings.cover_image IS 'Primary/cover image URL for the listing';
COMMENT ON COLUMN public.listings.features IS 'JSONB object containing property features like laundry, lawn, pool, etc.';
COMMENT ON COLUMN public.listings.listing_url IS 'External URL link to the full listing page';
COMMENT ON COLUMN public.listings.mls_number IS 'Multiple Listing Service (MLS) reference number';

-- Example features structure:
-- {
--   "laundry": "In-unit",
--   "parking": "Garage",
--   "lawn": true,
--   "pool": true,
--   "gym": false,
--   "petFriendly": true,
--   "furnished": false,
--   "airConditioning": true,
--   "heating": "Central",
--   "appliances": ["Dishwasher", "Refrigerator", "Microwave", "Oven"],
--   "utilities": ["Water", "Trash"],
--   "amenities": ["Balcony", "Storage"]
-- }
