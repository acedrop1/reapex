-- Migration: Update RLS policy to include admin role and hide_from_listing
-- Description: Allows admin role users to appear on public /agents page when not hidden
-- Created: 2026-01-08

-- Drop existing policy
DROP POLICY IF EXISTS "Public can view approved agents" ON public.users;

-- Recreate with admin role and hide_from_listing filter
CREATE POLICY "Public can view approved agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (
        role IN ('agent', 'admin_agent', 'admin')
        AND account_status = 'approved'
        AND (hide_from_listing = false OR hide_from_listing IS NULL)
    );

COMMENT ON POLICY "Public can view approved agents" ON public.users IS
'Allows public access to approved agent, admin_agent, and admin profiles
on /agents page, excluding those with hide_from_listing=true';
