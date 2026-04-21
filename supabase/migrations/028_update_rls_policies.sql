-- Migration: Update RLS Policies for User Approval System
-- Description: Updates RLS policies to enforce account_status = 'approved' for user access
-- Created: 2025-01-29

-- ============================================
-- Helper Function: Check if user is approved
-- ============================================

-- Create helper function to check if authenticated user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
        AND account_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is admin or broker (bypass approval)
CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'broker')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update Users Table Policies
-- ============================================

-- Drop and recreate users SELECT policy with approval check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;

CREATE POLICY "Approved users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        AND (account_status = 'approved' OR role IN ('admin', 'broker'))
    );

-- ============================================
-- Update Marketing Requests Policies
-- ============================================

DROP POLICY IF EXISTS "Agents can view own marketing requests" ON public.marketing_requests;

CREATE POLICY "Approved agents can view own marketing requests"
    ON public.marketing_requests FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

DROP POLICY IF EXISTS "Agents can create marketing requests" ON public.marketing_requests;

CREATE POLICY "Approved agents can create marketing requests"
    ON public.marketing_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid()
        AND is_user_approved()
    );

-- ============================================
-- Update Support Tickets Policies
-- ============================================

DROP POLICY IF EXISTS "Agents can view own support tickets" ON public.support_tickets;

CREATE POLICY "Approved agents can view own support tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

DROP POLICY IF EXISTS "Agents can create support tickets" ON public.support_tickets;

CREATE POLICY "Approved agents can create support tickets"
    ON public.support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid()
        AND is_user_approved()
    );

-- ============================================
-- Update Commissions Policies
-- ============================================

DROP POLICY IF EXISTS "Agents can view own commissions" ON public.commissions;

CREATE POLICY "Approved agents can view own commissions"
    ON public.commissions FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

-- ============================================
-- Update Announcements Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

CREATE POLICY "Approved users can view active announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        (published_at IS NULL OR published_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
        AND is_user_approved()
    );

-- ============================================
-- Update Brand Assets Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active brand assets" ON public.brand_assets;

CREATE POLICY "Approved users can view active brand assets"
    ON public.brand_assets FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

-- ============================================
-- Update Training Resources Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active training resources" ON public.training_resources;

CREATE POLICY "Approved users can view active training resources"
    ON public.training_resources FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

-- ============================================
-- Update Company Directory Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active directory entries" ON public.company_directory;

CREATE POLICY "Approved users can view active directory entries"
    ON public.company_directory FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

-- ============================================
-- Add Policies for Transactions Table (if exists)
-- ============================================

DO $$
BEGIN
    -- Check if transactions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

        -- Create new policy with approval check
        CREATE POLICY "Approved users can view own transactions"
            ON public.transactions FOR SELECT
            TO authenticated
            USING (
                (agent_id = auth.uid() AND is_user_approved())
                OR is_admin_or_broker()
            );
    END IF;
END $$;

-- ============================================
-- Add Policies for Calendar Events Table (if exists)
-- ============================================

DO $$
BEGIN
    -- Check if calendar_events table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Users can view own events" ON public.calendar_events;

        -- Create new policy with approval check
        CREATE POLICY "Approved users can view own events"
            ON public.calendar_events FOR SELECT
            TO authenticated
            USING (
                (agent_id = auth.uid() AND is_user_approved())
                OR is_admin_or_broker()
            );
    END IF;
END $$;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION public.is_user_approved() IS 'Helper function to check if the authenticated user has account_status = approved';
COMMENT ON FUNCTION public.is_admin_or_broker() IS 'Helper function to check if the authenticated user is an admin or broker (bypasses approval checks)';
