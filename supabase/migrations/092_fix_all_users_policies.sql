-- Comprehensive fix for all users table policies to prevent infinite recursion
-- This migration drops all existing users policies and recreates them using SECURITY DEFINER functions

-- Step 1: Ensure all helper functions exist with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('agent', 'admin_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'admin_agent', 'broker')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND account_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop ALL existing users table policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin and Admin-Agent can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Step 3: Create new policies using helper functions (NO RECURSION)

-- SELECT policy: Users can view their own profile, admins can view all
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
CREATE POLICY "Users can view own profile and admins can view all"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR is_admin()
    );

-- INSERT policy: Only admins can insert users
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- UPDATE policy: Users can update their own profile, admins can update all
DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.users;
CREATE POLICY "Users can update own profile and admins can update all"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
        OR is_admin()
    )
    WITH CHECK (
        auth.uid() = id
        OR is_admin()
    );

-- DELETE policy: Only admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
    ON public.users FOR DELETE
    TO authenticated
    USING (is_admin());

-- PUBLIC policy: Allow anyone to view approved agents for public profile pages
DROP POLICY IF EXISTS "Public can view approved agents" ON public.users;
CREATE POLICY "Public can view approved agents"
    ON public.users FOR SELECT
    TO anon
    USING (
        account_status = 'approved'
        AND role IN ('agent', 'admin_agent')
    );

-- Step 4: Add comments
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin privileges (admin or admin_agent role). Uses SECURITY DEFINER to prevent RLS recursion.';
COMMENT ON FUNCTION public.is_agent() IS 'Returns true if current user has agent privileges (agent or admin_agent role). Uses SECURITY DEFINER to prevent RLS recursion.';
COMMENT ON FUNCTION public.is_admin_or_broker() IS 'Returns true if current user is admin, broker, or admin_agent. Uses SECURITY DEFINER to prevent RLS recursion.';
COMMENT ON FUNCTION public.is_user_approved() IS 'Returns true if current user has account_status = approved. Uses SECURITY DEFINER to prevent RLS recursion.';
