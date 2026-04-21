-- Fix infinite recursion in users RLS policies
-- Drop the problematic admin policy and recreate it without recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Recreate admin policy without recursion (use auth.jwt() instead of querying users table)
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        (auth.jwt() ->> 'user_role')::text IN ('admin', 'broker')
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'broker')
        )
    );

-- Public can view active agents (simple check, no recursion)
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role = 'agent' AND is_active = true);

