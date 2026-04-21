-- Migration: Simplify Account Status
-- Description: Remove 'pending' and 'rejected' statuses. Users are auto-approved on creation, can only be suspended.
-- Created: 2025-01-29

-- Step 1: Update all existing users with pending/rejected status to approved
UPDATE public.users
SET account_status = 'approved'
WHERE account_status IN ('pending', 'rejected');

-- Step 2: Drop policies that depend on account_status column
DROP POLICY IF EXISTS "Public can view approved agents" ON public.users;
DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Approved agents can view own marketing requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Approved agents can create marketing requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Approved agents can view own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Approved agents can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Approved agents can view own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Approved users can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Approved users can view active brand assets" ON public.brand_assets;
DROP POLICY IF EXISTS "Approved users can view active training resources" ON public.training_resources;
DROP POLICY IF EXISTS "Approved users can view active directory entries" ON public.company_directory;
DROP POLICY IF EXISTS "Approved users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Approved users can view own events" ON public.calendar_events;

-- Step 3: Drop function that depends on account_status
DROP FUNCTION IF EXISTS public.is_user_approved();

-- Step 4: Drop the default to avoid casting issues
ALTER TABLE public.users
  ALTER COLUMN account_status DROP DEFAULT;

-- Step 5: Create new enum type with only approved and suspended
CREATE TYPE account_status_new AS ENUM ('approved', 'suspended');

-- Step 6: Alter the column to use the new type (casting values)
ALTER TABLE public.users
  ALTER COLUMN account_status TYPE account_status_new
  USING (
    CASE
      WHEN account_status::text = 'approved' THEN 'approved'::account_status_new
      WHEN account_status::text = 'suspended' THEN 'suspended'::account_status_new
      ELSE 'approved'::account_status_new
    END
  );

-- Step 7: Drop old enum type
DROP TYPE account_status;

-- Step 8: Rename new type to original name
ALTER TYPE account_status_new RENAME TO account_status;

-- Step 9: Set default to 'approved' (users are auto-approved when created)
ALTER TABLE public.users
  ALTER COLUMN account_status SET DEFAULT 'approved';

-- Step 10: Recreate is_user_approved() function with new logic (check NOT suspended)
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
        AND account_status != 'suspended'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Recreate policies
CREATE POLICY "Public can view approved agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (
        role = 'agent'
        AND account_status = 'approved'
    );

CREATE POLICY "Approved users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        AND (account_status = 'approved' OR role IN ('admin', 'broker'))
    );

CREATE POLICY "Approved agents can view own marketing requests"
    ON public.marketing_requests FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

CREATE POLICY "Approved agents can create marketing requests"
    ON public.marketing_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid()
        AND is_user_approved()
    );

CREATE POLICY "Approved agents can view own support tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

CREATE POLICY "Approved agents can create support tickets"
    ON public.support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid()
        AND is_user_approved()
    );

CREATE POLICY "Approved agents can view own commissions"
    ON public.commissions FOR SELECT
    TO authenticated
    USING (
        (agent_id = auth.uid() AND is_user_approved())
        OR is_admin_or_broker()
    );

CREATE POLICY "Approved users can view active announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        (published_at IS NULL OR published_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
        AND is_user_approved()
    );

CREATE POLICY "Approved users can view active brand assets"
    ON public.brand_assets FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

CREATE POLICY "Approved users can view active training resources"
    ON public.training_resources FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

CREATE POLICY "Approved users can view active directory entries"
    ON public.company_directory FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND is_user_approved()
    );

-- Recreate conditional policies (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        CREATE POLICY "Approved users can view own transactions"
            ON public.transactions FOR SELECT
            TO authenticated
            USING (
                (agent_id = auth.uid() AND is_user_approved())
                OR is_admin_or_broker()
            );
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
        CREATE POLICY "Approved users can view own events"
            ON public.calendar_events FOR SELECT
            TO authenticated
            USING (
                (agent_id = auth.uid() AND is_user_approved())
                OR is_admin_or_broker()
            );
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN public.users.account_status IS 'User account status: approved (active, default), suspended (temporarily blocked). Users are auto-approved on creation.';
COMMENT ON FUNCTION public.is_user_approved() IS 'Helper function to check if the authenticated user is not suspended (account_status != suspended)';
