-- Restore public INSERT policy for agent_applications
-- Migration 062 accidentally removed the public insert policy
-- This allows anyone to submit agent applications from the public form

-- Drop if exists to make idempotent
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Public can submit applications" ON public.agent_applications;

-- Recreate public insert policy for both anon and authenticated users
CREATE POLICY "Anyone can submit applications"
    ON public.agent_applications FOR INSERT
    WITH CHECK (true);
