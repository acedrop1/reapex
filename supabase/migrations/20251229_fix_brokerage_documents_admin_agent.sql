-- Migration: Fix brokerage_documents INSERT permissions for admin_agent
-- Description: Allow admin_agent role to upload forms and manage brokerage documents
-- Created: 2025-12-29

-- Drop existing INSERT policies that only allow admin
DROP POLICY IF EXISTS "Only admins can insert brokerage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON public.brokerage_documents;

-- Create new INSERT policy allowing both admin and admin_agent
CREATE POLICY "Admins and admin_agents can insert brokerage documents"
  ON public.brokerage_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Drop existing UPDATE policy that only allows admin
DROP POLICY IF EXISTS "Only admins can update brokerage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.brokerage_documents;

-- Create new UPDATE policy allowing both admin and admin_agent
CREATE POLICY "Admins and admin_agents can update brokerage documents"
  ON public.brokerage_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Verify DELETE policy already allows admin_agent (it does from the query results)
-- "Admins can delete brokerage documents" already includes admin_agent

COMMENT ON POLICY "Admins and admin_agents can insert brokerage documents" ON public.brokerage_documents IS
  'Users with admin or admin_agent role can upload new forms and brokerage documents';

COMMENT ON POLICY "Admins and admin_agents can update brokerage documents" ON public.brokerage_documents IS
  'Users with admin or admin_agent role can update existing forms and brokerage documents';
