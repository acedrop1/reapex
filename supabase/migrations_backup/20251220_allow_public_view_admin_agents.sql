-- Migration: Allow public to view admin_agents on /agents page
-- Description: Update RLS policy to include admin_agent role in public agents directory
-- Created: 2025-01-20

-- Drop and recreate the policy to include admin_agent role
DROP POLICY IF EXISTS "Public can view approved agents" ON public.users;

CREATE POLICY "Public can view approved agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (
        role IN ('agent', 'admin_agent')
        AND account_status = 'approved'
    );

COMMENT ON POLICY "Public can view approved agents" ON public.users IS
'Allows public access to view approved agent and admin_agent profiles on /agents page';
