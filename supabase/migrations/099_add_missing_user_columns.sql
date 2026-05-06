-- Migration: Add missing user columns for agent profiles and public pages
-- These columns are referenced in the code but were never created in the database

-- slug: URL-friendly identifier for agent profile pages
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug) WHERE slug IS NOT NULL;

-- account_status: Controls whether agent profile is publicly visible
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';

-- display_order: Controls ordering on the agents listing page
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- hide_from_listing: Agent can opt out of public listing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hide_from_listing BOOLEAN DEFAULT false;

-- headshot_url: Agent profile photo
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS headshot_url TEXT;

-- bio: Agent biography
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- title: Agent's professional title (e.g., "Co-Founder", "Licensed Agent")
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS title TEXT;

-- phone: Agent phone number
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- website: Agent personal website
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website TEXT;

-- Social media links
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_x TEXT;

-- Professional details
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nmls_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_public TEXT;

-- Visibility settings
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT true;

-- years_experience
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- specialties (JSONB array)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;

-- =============================================
-- Generate slugs for existing users who don't have one
-- =============================================
CREATE OR REPLACE FUNCTION generate_user_slug(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(input_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Set slugs for all users that have a full_name but no slug
UPDATE public.users
SET slug = generate_user_slug(full_name)
WHERE slug IS NULL AND full_name IS NOT NULL AND full_name != '';

-- Set account_status to 'approved' for all existing users
UPDATE public.users
SET account_status = 'approved'
WHERE account_status IS NULL OR account_status = 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_display_order ON public.users(display_order);

-- Create the agent_ratings_summary view if it doesn't exist
CREATE OR REPLACE VIEW agent_ratings_summary AS
SELECT
  agent_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM agent_reviews
WHERE is_approved = true
GROUP BY agent_id;
