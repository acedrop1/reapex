-- Migration: Fix Users SELECT Policy - Final Version
-- Description: Simplify user profile access - users can always see their own profile
-- Created: 2025-01-29

-- The problem: Migration 028 made it so users couldn't see their own profile unless approved
-- This broke the dashboard layout which needs to fetch user data to check approval status

-- Solution: Users can ALWAYS view their own profile
-- Approval checks happen in the application layer (dashboard layout)
-- All other resources (transactions, announcements, etc.) still require approval

-- Drop all existing SELECT policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins and brokers can view all users" ON public.users;

-- Create simple, clean policy: users can view own profile OR admins/brokers can view all
CREATE POLICY "Users can view own profile or admins can view all"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        -- Users can always view their own profile (needed for dashboard)
        auth.uid() = id
        OR
        -- Admins and brokers can view all profiles (needed for admin pages)
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'broker')
        )
    );

-- Comment explaining the policy
COMMENT ON POLICY "Users can view own profile or admins can view all" ON public.users IS
'Allows users to view their own profile (required for app to function). Admins and brokers can view all profiles for management. Approval status is checked in application layer, not RLS.';
