-- FINAL FIX: Ensure public can view agents
-- The issue is that Supabase RLS policies need to explicitly allow anonymous access
-- Run this in Supabase SQL Editor

-- Drop ALL existing SELECT policies on users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Create policies in order: most permissive first
-- 1. Public can view active agents (allows anonymous/unauthenticated)
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role::text = 'agent' AND is_active = true);

-- 2. Users can view their own profile (allows authenticated)
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- 3. Admins can view all users (allows authenticated admins)
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'broker')
        )
    );

