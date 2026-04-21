-- Migration: Fix listings table admin INSERT policy
-- Date: 2025-12-20
-- Description: Add missing admin INSERT policy for listings table to allow admins to create listings on behalf of agents

-- Add admin INSERT policy for listings table
CREATE POLICY "Admins can insert listings for any agent"
    ON public.listings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Add comment for documentation
COMMENT ON POLICY "Admins can insert listings for any agent" ON public.listings IS
    'Allows admins and brokers to create listings on behalf of any agent, matching the pattern of other admin policies (SELECT, UPDATE, DELETE)';
