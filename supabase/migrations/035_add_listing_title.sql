-- Migration: Add title field to listings table
-- Description: Add a descriptive title field for property listings
-- Created: 2025-01-29

-- Add title column
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment
COMMENT ON COLUMN public.listings.title IS 'Descriptive title for the listing (e.g., "Luxury 3BR Apartment in Downtown")';
