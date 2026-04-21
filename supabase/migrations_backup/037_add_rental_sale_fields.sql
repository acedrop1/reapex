-- Migration: Add rental and sale specific fields to listings
-- Description: Add deposit, monthly_rental, amenities for rentals and features for sales
-- Created: 2025-01-29

-- Add deposit field for rentals
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS deposit DECIMAL(12, 2);

-- Add monthly_rental field for rentals
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS monthly_rental DECIMAL(12, 2);

-- Add amenities array for rentals
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN public.listings.deposit IS 'Security deposit amount for rental listings';
COMMENT ON COLUMN public.listings.monthly_rental IS 'Monthly rental amount (replaces price for rentals)';
COMMENT ON COLUMN public.listings.amenities IS 'Array of amenities for rental properties (e.g., ["wifi", "parking", "gym", "pool"])';
COMMENT ON COLUMN public.listings.features IS 'JSONB object for property features (for sales and rentals)';

-- Convert features column to JSONB if it's not already
ALTER TABLE public.listings
    ALTER COLUMN features TYPE JSONB USING features::jsonb;

-- Set default for features
ALTER TABLE public.listings
    ALTER COLUMN features SET DEFAULT '{}'::jsonb;
