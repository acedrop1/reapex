-- Migration: Fix admin_agent permissions for forms and training resources
-- Description: Update RLS policies to use is_admin() helper function for admin_agent access
-- Created: 2025-12-29

-- ============================================
-- FORMS TABLE POLICIES
-- ============================================

-- Drop existing forms policies
DROP POLICY IF EXISTS "Anyone can view forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can insert forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can update forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can delete forms" ON public.forms;

-- Policy: Anyone authenticated can view forms
CREATE POLICY "Anyone can view forms"
  ON public.forms
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins and admin_agents can insert forms
CREATE POLICY "Admins and admin_agents can insert forms"
  ON public.forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Policy: Admins and admin_agents can update forms
CREATE POLICY "Admins and admin_agents can update forms"
  ON public.forms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  );

-- Policy: Admins and admin_agents can delete forms
CREATE POLICY "Admins and admin_agents can delete forms"
  ON public.forms
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
-- TRAINING RESOURCES STORAGE POLICIES
-- ============================================

-- Drop existing training-resources bucket policies
DROP POLICY IF EXISTS "Admins can upload training resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update training resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete training resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view training resources" ON storage.objects;

-- Policy: Admins and admin_agents can upload training resources
CREATE POLICY "Admins and admin_agents can upload training resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_agent')
  )
);

-- Policy: Admins and admin_agents can update training resources
CREATE POLICY "Admins and admin_agents can update training resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_agent')
  )
)
WITH CHECK (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_agent')
  )
);

-- Policy: Admins and admin_agents can delete training resources
CREATE POLICY "Admins and admin_agents can delete training resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_agent')
  )
);

-- Policy: All authenticated users can view training resources
CREATE POLICY "Authenticated users can view training resources"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training-resources');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Admins and admin_agents can insert forms" ON public.forms IS
  'Users with admin or admin_agent role can create new forms';

COMMENT ON POLICY "Admins and admin_agents can update forms" ON public.forms IS
  'Users with admin or admin_agent role can update existing forms';

COMMENT ON POLICY "Admins and admin_agents can delete forms" ON public.forms IS
  'Users with admin or admin_agent role can delete forms';

COMMENT ON POLICY "Admins and admin_agents can upload training resources" ON storage.objects IS
  'Users with admin or admin_agent role can upload training resources';

COMMENT ON POLICY "Admins and admin_agents can update training resources" ON storage.objects IS
  'Users with admin or admin_agent role can update training resources';

COMMENT ON POLICY "Admins and admin_agents can delete training resources" ON storage.objects IS
  'Users with admin or admin_agent role can delete training resources';
