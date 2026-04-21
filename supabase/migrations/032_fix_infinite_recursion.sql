-- Migration: Fix Infinite Recursion in Users RLS Policy
-- Description: Remove recursive policy that checks users table within users table policy
-- Created: 2025-01-29

-- The problem: The policy was checking the users table to determine if someone is admin,
-- which creates infinite recursion when trying to read from users table.

-- Solution: Simple policy - users can ALWAYS view their own profile.
-- Admin access will be handled separately.

-- Drop all existing SELECT policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins and brokers can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.users;

-- Create simple policy: authenticated users can view their own profile
-- This is all we need - no recursion, no complexity
CREATE POLICY "Authenticated users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- For admin access to all users, we'll use service_role or handle it differently
-- The /admin/users page should use the API endpoint which uses service role credentials
