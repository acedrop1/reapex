-- Migration: Add SELECT policy for admins on listings table
-- Description: Allows admins and admin_agents to view all listings regardless of agent or status
-- This fixes the issue where admins cannot see listings in /admin/all-listings

-- Add SELECT policy for admins to view all listings
CREATE POLICY "Admins can view all listings"
    ON public.listings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- Verification: Check all SELECT policies for listings
-- Expected: 3 policies - Public (active only), Agents (own listings), Admins (all listings)
