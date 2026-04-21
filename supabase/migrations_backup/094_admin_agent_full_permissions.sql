-- Grant admin_agent role the same permissions as admin across all RLS policies
-- This migration updates all policies that check for 'admin' role to also include 'admin_agent'

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Training Resources Storage
DROP POLICY IF EXISTS "Admins can upload training resources" ON storage.objects;
CREATE POLICY "Admins can upload training resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'training-resources'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can update training resources" ON storage.objects;
CREATE POLICY "Admins can update training resources"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'training-resources'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can delete training resources" ON storage.objects;
CREATE POLICY "Admins can delete training resources"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'training-resources'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

-- Announcement Attachments Storage
DROP POLICY IF EXISTS "Admins can insert announcement attachments" ON storage.objects;
CREATE POLICY "Admins can insert announcement attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can update announcement attachments" ON storage.objects;
CREATE POLICY "Admins can update announcement attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can delete announcement attachments" ON storage.objects;
CREATE POLICY "Admins can delete announcement attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'admin_agent')
    )
  );

-- Canva Templates Storage
DROP POLICY IF EXISTS "Admins can manage canva templates" ON storage.objects;
CREATE POLICY "Admins can manage canva templates"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'canva-templates'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

-- Listing Photos Storage
DROP POLICY IF EXISTS "Admins can delete any listing photo" ON storage.objects;
CREATE POLICY "Admins can delete any listing photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-photos'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'admin_agent')
    )
  );

-- Profile Photos Storage
DROP POLICY IF EXISTS "Admins can insert profile photos" ON storage.objects;
CREATE POLICY "Admins can insert profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can update profile photos" ON storage.objects;
CREATE POLICY "Admins can update profile photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can delete profile photos" ON storage.objects;
CREATE POLICY "Admins can delete profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

-- Transaction Documents Storage
DROP POLICY IF EXISTS "Admins can view all transaction documents" ON storage.objects;
CREATE POLICY "Admins can view all transaction documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'transaction-documents'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can upload transaction documents" ON storage.objects;
CREATE POLICY "Admins can upload transaction documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'transaction-documents'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can delete transaction documents" ON storage.objects;
CREATE POLICY "Admins can delete transaction documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'transaction-documents'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

-- Documents Storage (general)
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;
CREATE POLICY "Admins can manage all documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'admin_agent')
    )
  );

-- ============================================================================
-- TABLE POLICIES
-- ============================================================================

-- Note: Many table policies may already use the is_admin() helper function
-- created in migration 090_admin_agent_policies.sql which includes admin_agent
-- This migration ensures any remaining direct role checks are updated

COMMENT ON FUNCTION is_admin() IS 'Returns true if current user has admin privileges (admin or admin_agent role). Used across RLS policies.';
COMMENT ON FUNCTION is_agent() IS 'Returns true if current user has agent privileges (agent or admin_agent role). Used across RLS policies.';
