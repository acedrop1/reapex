-- Consolidated RLS policies for public submissions
-- Run this in Supabase SQL Editor to enable:
-- 1. Public review submissions
-- 2. Public contact form submissions
-- 3. Public /sell form submissions (contacts table)

BEGIN;

-- =============================================================================
-- REVIEWS: Allow public to submit reviews
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can submit reviews for approval" ON agent_reviews;
DROP POLICY IF EXISTS "Admins can insert reviews" ON agent_reviews;

CREATE POLICY "Anyone can submit reviews for approval"
ON agent_reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (is_approved = false); -- Reviews default to unapproved

COMMENT ON POLICY "Anyone can submit reviews for approval" ON agent_reviews IS
'Allows public users to submit reviews which default to unapproved status. Only admins can approve reviews via UPDATE policy.';

-- =============================================================================
-- CONTACTS: Allow public to submit contact forms
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contacts;

CREATE POLICY "Anyone can submit contact form"
ON contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

COMMIT;

-- Note: SELECT, UPDATE, DELETE remain restricted to agents/admins via existing policies
