-- Migration: Fix marketing templates and external links permissions for admin_agent
-- Description: Allow admin_agent role to manage Canva templates and external links
-- Created: 2025-12-29

-- ============================================
-- CANVA TEMPLATES (Marketing Materials)
-- ============================================

-- Drop conflicting INSERT policies
DROP POLICY IF EXISTS "Admins can insert templates" ON public.canva_templates;

-- Drop conflicting UPDATE policy
DROP POLICY IF EXISTS "Admins can update templates" ON public.canva_templates;

-- Drop conflicting DELETE policy
DROP POLICY IF EXISTS "Admins can delete templates" ON public.canva_templates;

-- The "Admins can manage templates" ALL policy already includes admin_agent
-- But we need explicit INSERT/UPDATE/DELETE to override the restrictive ones

-- Create INSERT policy allowing admin_agent
CREATE POLICY "Admins and admin_agents can insert templates"
  ON public.canva_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Create UPDATE policy allowing admin_agent
CREATE POLICY "Admins and admin_agents can update templates"
  ON public.canva_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Create DELETE policy allowing admin_agent
CREATE POLICY "Admins and admin_agents can delete templates"
  ON public.canva_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- ============================================
-- EXTERNAL LINKS
-- ============================================

-- Drop the conflicting restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert external links" ON public.external_links;

-- The "Admins can create external links" INSERT policy already includes admin_agent
-- The UPDATE and DELETE policies already include admin_agent
-- We just need to remove the conflicting restrictive INSERT policy

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Admins and admin_agents can insert templates" ON public.canva_templates IS
  'Users with admin or admin_agent role can create new Canva templates';

COMMENT ON POLICY "Admins and admin_agents can update templates" ON public.canva_templates IS
  'Users with admin or admin_agent role can update existing Canva templates';

COMMENT ON POLICY "Admins and admin_agents can delete templates" ON public.canva_templates IS
  'Users with admin or admin_agent role can delete Canva templates';
