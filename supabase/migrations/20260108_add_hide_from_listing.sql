-- Migration: Add hide_from_listing column for agent visibility control
-- Description: Allows admins to hide specific agents from public listing
-- Created: 2026-01-08

-- Add hide_from_listing column to users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS hide_from_listing BOOLEAN DEFAULT false;

-- Create index for efficient filtering on public listing page
CREATE INDEX IF NOT EXISTS idx_users_hide_from_listing
    ON public.users(hide_from_listing)
    WHERE hide_from_listing = false;

-- Add comment explaining the column
COMMENT ON COLUMN public.users.hide_from_listing IS
'Controls whether agent appears in public /agents listing.
false (default) = visible, true = hidden.
Useful for inactive agents or those who prefer not to be listed publicly.';

-- Ensure existing users default to visible (false)
UPDATE public.users
SET hide_from_listing = false
WHERE hide_from_listing IS NULL;
