-- COMPREHENSIVE FIX: Ensure public can view agents
-- This should work regardless of how the role enum is compared

-- First, drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create the public agent policy FIRST (most permissive)
-- This allows anonymous users to view active agents
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (
        (role::text = 'agent' OR role = 'agent'::user_role)
        AND is_active = true
    );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'broker')
        )
    );

