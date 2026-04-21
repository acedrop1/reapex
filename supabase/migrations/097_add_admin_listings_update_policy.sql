-- Migration: Add admin UPDATE policy for listings table
-- Description: Allows admin and admin_agent roles to update any listing
-- This fixes the issue where admins cannot edit listings assigned to other agents

-- Create UPDATE policy for admins to update any listing
CREATE POLICY "Admins can update any listing"
    ON public.listings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- Verification: Check all UPDATE policies are in place
-- Expected: Two policies
-- 1. "Agents can update their own listings" - agents update where agent_id = auth.uid()
-- 2. "Admins can update any listing" - admins/admin_agents can update any listing
