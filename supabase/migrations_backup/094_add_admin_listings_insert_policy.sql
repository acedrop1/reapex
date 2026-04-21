-- Migration: Add INSERT policy for admins on listings table
-- Description: Allows admins and admin_agents to insert listings for any agent
-- This fixes MLS import failures where admins assign listings to other agents

-- Add INSERT policy for admins and admin_agents
CREATE POLICY "Admins can insert listings for any agent"
    ON public.listings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
    );

-- Verification: Check that all CRUD policies exist for listings
-- Expected: Agents have all 4 (SELECT, INSERT, UPDATE, DELETE) for their own listings
-- Expected: Admins have all 4 (SELECT, INSERT, UPDATE, DELETE) for all listings
