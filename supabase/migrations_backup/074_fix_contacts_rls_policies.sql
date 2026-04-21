-- Fix RLS policies for contacts table to allow public submissions
-- This removes the restrictive agent-only INSERT policy and replaces it with one that allows both:
-- 1. Anonymous public submissions (agent_id IS NULL)
-- 2. Agent-created contacts (agent_id = auth.uid())

BEGIN;

-- Drop ALL existing INSERT policies to start fresh
DROP POLICY IF EXISTS "Agents can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contacts;
DROP POLICY IF EXISTS "Public and agent contact submissions" ON public.contacts;

-- Create new INSERT policy that allows:
-- 1. Public submissions without agent assignment (agent_id IS NULL)
-- 2. Agents creating contacts for themselves (agent_id = auth.uid())
-- Using DO block to make it truly idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contacts'
    AND policyname = 'Public and agent contact submissions'
  ) THEN
    CREATE POLICY "Public and agent contact submissions"
    ON public.contacts
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      agent_id IS NULL  -- Allow public submissions without agent
      OR
      agent_id = auth.uid()  -- Allow agents to create their own contacts
    );
  END IF;
END $$;

COMMENT ON POLICY "Public and agent contact submissions" ON public.contacts IS
'Allows both anonymous public form submissions (agent_id=NULL) and authenticated agents to create contacts assigned to themselves';

-- Keep the SELECT policy restrictive - only agents can view their contacts
-- Admins can view via service role key
DROP POLICY IF EXISTS "Agents can view their own contacts" ON public.contacts;

CREATE POLICY "Agents can view their own contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- Keep UPDATE and DELETE restrictive to agents only
DROP POLICY IF EXISTS "Agents can update their own contacts" ON public.contacts;

CREATE POLICY "Agents can update their own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Agents can delete their own contacts" ON public.contacts;

CREATE POLICY "Agents can delete their own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

COMMIT;
