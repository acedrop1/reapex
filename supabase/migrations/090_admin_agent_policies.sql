-- Update RLS policies and create helper functions for admin_agent role
-- This migration depends on 089_add_admin_agent_enum.sql being applied first

-- First, create helper functions with SECURITY DEFINER to bypass RLS
-- This prevents infinite recursion when checking user roles

-- Add helper function to check if user has admin privileges (admin or admin_agent)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to check if user has agent privileges (agent or admin_agent)
CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('agent', 'admin_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update RLS policies to use the helper functions
-- This avoids infinite recursion by using SECURITY DEFINER functions

-- For users table - admin_agent can view all users like admins
DROP POLICY IF EXISTS "Admin and Admin-Agent can view all users" ON public.users;
CREATE POLICY "Admin and Admin-Agent can view all users"
    ON public.users FOR SELECT
    USING (
        auth.uid() = id OR
        is_admin()
    );

-- Comment on functions
COMMENT ON FUNCTION is_admin() IS 'Returns true if current user has admin privileges (admin or admin_agent role)';
COMMENT ON FUNCTION is_agent() IS 'Returns true if current user has agent privileges (agent or admin_agent role)';
