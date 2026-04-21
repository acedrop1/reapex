-- Check and fix RLS on users table
-- The issue might be that RLS needs to be explicitly enabled or policies need to be in correct order

-- First, ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Create public agent policy FIRST (most permissive)
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    TO public
    USING (role = 'agent' AND is_active = true);

-- Then create authenticated user policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Admin policy (check auth.users to avoid recursion)
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

