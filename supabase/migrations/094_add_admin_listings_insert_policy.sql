-- Migration: Fix INSERT policies for listings table
-- Description: Separates admin and agent INSERT policies for clarity
-- This fixes MLS import failures where admins assign listings to other agents

-- Drop any existing INSERT policies to start clean
DROP POLICY IF EXISTS "Admins can insert listings for any agent" ON public.listings;
DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;

-- Create separate policies for admins and agents
CREATE POLICY "Admins can insert any listing"
    ON public.listings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

CREATE POLICY "Agents can insert own listings"
    ON public.listings FOR INSERT
    TO authenticated
    WITH CHECK (agent_id = auth.uid());

-- Verification: Check that all CRUD policies exist for listings
-- Expected: Agents have all 4 (SELECT, INSERT, UPDATE, DELETE) for their own listings
-- Expected: Admins have INSERT for all listings + SELECT/UPDATE/DELETE based on other policies
