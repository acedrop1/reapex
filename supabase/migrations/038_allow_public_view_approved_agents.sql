-- Migration: Allow public to view approved agents
-- Description: Add RLS policy so public /agents page can display approved agents
-- Created: 2025-01-29

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view approved agents" ON public.users;

-- Create policy to allow public (unauthenticated) users to view approved agents
CREATE POLICY "Public can view approved agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (
        role = 'agent'
        AND account_status = 'approved'
    );

COMMENT ON POLICY "Public can view approved agents" ON public.users IS 'Allows public access to view approved agent profiles on /agents page';
