-- Fix infinite recursion in users table policy
-- The "Approved users can view their own profile" policy was directly querying
-- the users table columns (account_status, role) which caused recursion

-- Update is_admin_or_broker to include admin_agent role
CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'broker', 'admin_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the users policy to use helper function instead of direct query
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;

CREATE POLICY "Approved users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR is_admin_or_broker()
    );

-- Add comment
COMMENT ON POLICY "Approved users can view their own profile" ON public.users IS
'Users can view their own profile. Admins, brokers, and admin_agents can view all profiles via is_admin_or_broker() helper function which uses SECURITY DEFINER to prevent recursion.';
