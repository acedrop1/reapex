-- Fix ALL RLS policies to recognize 'broker' role as admin
-- The app treats both 'admin' and 'broker' as admin (see lib/utils/auth.ts)
-- but all RLS policies only checked for role = 'admin', causing silent failures
-- for users with role = 'broker'

-- Helper function: returns true if the current user is an admin or broker
CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'broker')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- brokerage_documents
-- ============================================================
DROP POLICY IF EXISTS "Only admins can insert brokerage documents" ON public.brokerage_documents;
CREATE POLICY "Only admins can insert brokerage documents"
  ON public.brokerage_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Only admins can update brokerage documents" ON public.brokerage_documents;
CREATE POLICY "Only admins can update brokerage documents"
  ON public.brokerage_documents FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Only admins can delete brokerage documents" ON public.brokerage_documents;
CREATE POLICY "Only admins can delete brokerage documents"
  ON public.brokerage_documents FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- external_links
-- ============================================================
DROP POLICY IF EXISTS "Only admins can insert external links" ON public.external_links;
CREATE POLICY "Only admins can insert external links"
  ON public.external_links FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Only admins can update external links" ON public.external_links;
CREATE POLICY "Only admins can update external links"
  ON public.external_links FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Only admins can delete external links" ON public.external_links;
CREATE POLICY "Only admins can delete external links"
  ON public.external_links FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Only admins can toggle external links" ON public.external_links;
CREATE POLICY "Only admins can toggle external links"
  ON public.external_links FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- canva_templates
-- ============================================================
DROP POLICY IF EXISTS "Only admins can manage templates" ON public.canva_templates;
CREATE POLICY "Only admins can manage templates"
  ON public.canva_templates FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "admins_manage_canva_templates" ON public.canva_templates;
CREATE POLICY "admins_manage_canva_templates"
  ON public.canva_templates FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

-- ============================================================
-- training_resources
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert training resources" ON public.training_resources;
CREATE POLICY "Admins can insert training resources"
  ON public.training_resources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can update training resources" ON public.training_resources;
CREATE POLICY "Admins can update training resources"
  ON public.training_resources FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can delete training resources" ON public.training_resources;
CREATE POLICY "Admins can delete training resources"
  ON public.training_resources FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- announcements (and announcement_attachments)
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can insert announcement attachments" ON public.announcement_attachments;
CREATE POLICY "Admins can insert announcement attachments"
  ON public.announcement_attachments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can update announcement attachments" ON public.announcement_attachments;
CREATE POLICY "Admins can update announcement attachments"
  ON public.announcement_attachments FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can delete announcement attachments" ON public.announcement_attachments;
CREATE POLICY "Admins can delete announcement attachments"
  ON public.announcement_attachments FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- commission_payouts
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert commission payouts" ON public.commission_payouts;
CREATE POLICY "Admins can insert commission payouts"
  ON public.commission_payouts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can update commission payouts" ON public.commission_payouts;
CREATE POLICY "Admins can update commission payouts"
  ON public.commission_payouts FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can delete commission payouts" ON public.commission_payouts;
CREATE POLICY "Admins can delete commission payouts"
  ON public.commission_payouts FOR DELETE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- contacts / contact_activities / contact_agent_assignments
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;
CREATE POLICY "Admins can manage all contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can manage all contact activities" ON public.contact_activities;
CREATE POLICY "Admins can manage all contact activities"
  ON public.contact_activities FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can manage contact agent assignments" ON public.contact_agent_assignments;
CREATE POLICY "Admins can manage contact agent assignments"
  ON public.contact_agent_assignments FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

-- ============================================================
-- transactions / transaction_documents / transaction_notes
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can manage transaction documents" ON public.transaction_documents;
CREATE POLICY "Admins can manage transaction documents"
  ON public.transaction_documents FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

DROP POLICY IF EXISTS "Admins can manage transaction notes" ON public.transaction_notes;
CREATE POLICY "Admins can manage transaction notes"
  ON public.transaction_notes FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

-- ============================================================
-- meetings
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage meetings" ON public.meetings;
CREATE POLICY "Admins can manage meetings"
  ON public.meetings FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

-- ============================================================
-- tour_appointments
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage tour appointments" ON public.tour_appointments;
CREATE POLICY "Admins can manage tour appointments"
  ON public.tour_appointments FOR ALL TO authenticated
  USING (public.is_admin_or_broker())
  WITH CHECK (public.is_admin_or_broker());

-- ============================================================
-- document_access_logs
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all access logs" ON public.document_access_logs;
CREATE POLICY "Admins can view all access logs"
  ON public.document_access_logs FOR SELECT TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- users table — admin management
-- ============================================================
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE TO authenticated
  USING (public.is_admin_or_broker());

-- ============================================================
-- Storage policies — documents bucket
-- ============================================================
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin update documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete from documents bucket" ON storage.objects;

CREATE POLICY "Admin upload to documents bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_admin_or_broker()
  );

CREATE POLICY "Admin update documents bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin_or_broker()
  );

CREATE POLICY "Admin delete from documents bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin_or_broker()
  );

-- ============================================================
-- Storage policies — announcement-attachments bucket
-- ============================================================
DROP POLICY IF EXISTS "Admins can upload announcement attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload announcement attachments" ON storage.objects;

CREATE POLICY "Admin upload announcement attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'announcement-attachments'
    AND public.is_admin_or_broker()
  );

-- ============================================================
-- Storage policies — external-link-logos bucket
-- ============================================================
DROP POLICY IF EXISTS "Admins upload external link logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload external link logos" ON storage.objects;

CREATE POLICY "Admin upload external link logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'external-link-logos'
    AND public.is_admin_or_broker()
  );

CREATE POLICY "Admin update external link logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'external-link-logos'
    AND public.is_admin_or_broker()
  );

CREATE POLICY "Admin delete external link logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'external-link-logos'
    AND public.is_admin_or_broker()
  );
