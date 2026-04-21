-- Migration: Add listing_title and slug fields to listings table
-- Purpose: Support city/listing-title URL pattern for SEO-friendly URLs
-- Example URL: /listings/fort-lee/luxury-waterfront-condo

-- Add new columns
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS listing_title TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);

-- Create composite index on (property_city, slug) for city-specific queries
CREATE INDEX IF NOT EXISTS idx_listings_city_slug ON listings(property_city, slug);

-- Function to generate URL-safe slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special chars
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to ensure unique slug
CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug TEXT, listing_id UUID)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INT := 1;
BEGIN
  final_slug := SUBSTRING(base_slug, 1, 100);

  -- Check if slug exists (excluding current listing)
  WHILE EXISTS (
    SELECT 1 FROM listings
    WHERE slug = final_slug
    AND id != listing_id
  ) LOOP
    final_slug := SUBSTRING(base_slug, 1, 95) || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate slug before insert/update
CREATE OR REPLACE FUNCTION auto_generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Only generate if slug is NULL or listing_title changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.listing_title IS DISTINCT FROM NEW.listing_title) THEN
    -- Use listing_title if available, otherwise use property_address
    IF NEW.listing_title IS NOT NULL AND NEW.listing_title != '' THEN
      base_slug := generate_slug(NEW.listing_title);
    ELSIF NEW.property_address IS NOT NULL THEN
      -- Generate from address as fallback
      base_slug := generate_slug(
        COALESCE(NEW.property_type::TEXT, '') || ' ' ||
        COALESCE(NEW.bedrooms::TEXT, '') || 'br ' ||
        COALESCE(NEW.bathrooms::TEXT, '') || 'ba ' ||
        SPLIT_PART(NEW.property_address, ',', 1)  -- First part of address
      );
    ELSE
      base_slug := 'listing-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;

    -- Ensure uniqueness
    NEW.slug := ensure_unique_slug(base_slug, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto slug generation
DROP TRIGGER IF EXISTS trigger_auto_generate_listing_slug ON listings;
CREATE TRIGGER trigger_auto_generate_listing_slug
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_listing_slug();

-- Generate slugs for existing listings
-- This will be handled by the trigger, but we can force an update
UPDATE listings
SET slug = NULL  -- Force trigger to regenerate slug
WHERE slug IS NULL;

-- Add comment to columns
COMMENT ON COLUMN listings.listing_title IS 'Optional custom title for the listing, used in slug generation';
COMMENT ON COLUMN listings.slug IS 'URL-safe slug generated from listing_title or property_address, used in SEO-friendly URLs';
