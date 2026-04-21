-- Migration: Add slug field to users table
-- Description: Add slug for SEO-friendly agent profile URLs (e.g., /agent/john-smith)
-- Created: 2025-01-29

-- Add slug column
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS users_slug_unique ON public.users(slug);

-- Add comment
COMMENT ON COLUMN public.users.slug IS 'URL-friendly slug for agent profile pages (e.g., john-smith)';

-- Function to generate slug from full_name
CREATE OR REPLACE FUNCTION generate_user_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from full_name by converting to lowercase and replacing spaces with hyphens
    IF NEW.full_name IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
        NEW.slug := lower(regexp_replace(trim(NEW.full_name), '[^a-zA-Z0-9]+', '-', 'g'));
        -- Remove leading/trailing hyphens
        NEW.slug := trim(both '-' from NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert/update
DROP TRIGGER IF EXISTS generate_user_slug_trigger ON public.users;
CREATE TRIGGER generate_user_slug_trigger
    BEFORE INSERT OR UPDATE OF full_name
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_slug();

-- Backfill slugs for existing users
UPDATE public.users
SET slug = lower(regexp_replace(trim(full_name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE full_name IS NOT NULL AND (slug IS NULL OR slug = '');

-- Clean up any leading/trailing hyphens from backfill
UPDATE public.users
SET slug = trim(both '-' from slug)
WHERE slug IS NOT NULL;
