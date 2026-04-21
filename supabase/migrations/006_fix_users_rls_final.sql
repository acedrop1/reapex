-- Fix users RLS policies to avoid recursion
-- The admin policy was querying users table causing infinite recursion

-- Drop all existing SELECT policies on users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Recreate policies without recursion
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Public can view active agents (no recursion, simple check)
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role = 'agent' AND is_active = true);

-- Admins can view all users (check auth.users metadata, not public.users to avoid recursion)
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'broker')
        )
    );

