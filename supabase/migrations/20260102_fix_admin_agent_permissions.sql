-- Migration: Fix admin_agent permissions to match admin role
-- This migration ensures admin_agent has the same permissions as admin across all tables
-- Uses is_admin() helper function which checks both 'admin' and 'admin_agent' roles

-- ============================================================================
-- EXTERNAL LINKS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin can insert external links" ON public.external_links;
DROP POLICY IF EXISTS "Admin can update external links" ON public.external_links;
DROP POLICY IF EXISTS "Admin can delete external links" ON public.external_links;

CREATE POLICY "Admin can insert external links"
ON public.external_links FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update external links"
ON public.external_links FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete external links"
ON public.external_links FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- BROKERAGE DOCUMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin can insert brokerage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admin can update brokerage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admin can delete brokerage documents" ON public.brokerage_documents;

CREATE POLICY "Admin can insert brokerage documents"
ON public.brokerage_documents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update brokerage documents"
ON public.brokerage_documents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete brokerage documents"
ON public.brokerage_documents FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- TRAINING RESOURCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin can insert training resources" ON public.training_resources;
DROP POLICY IF EXISTS "Admin can update training resources" ON public.training_resources;
DROP POLICY IF EXISTS "Admin can delete training resources" ON public.training_resources;

CREATE POLICY "Admin can insert training resources"
ON public.training_resources FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update training resources"
ON public.training_resources FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete training resources"
ON public.training_resources FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- CANVA TEMPLATES (MARKETING TEMPLATES) POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin can insert canva templates" ON public.canva_templates;
DROP POLICY IF EXISTS "Admin can update canva templates" ON public.canva_templates;
DROP POLICY IF EXISTS "Admin can delete canva templates" ON public.canva_templates;

CREATE POLICY "Admin can insert canva templates"
ON public.canva_templates FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update canva templates"
ON public.canva_templates FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete canva templates"
ON public.canva_templates FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- MEETINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all meetings" ON public.meetings;

CREATE POLICY "Admins can manage all meetings"
ON public.meetings
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STORAGE BUCKET: transaction-documents
-- ============================================================================

DROP POLICY IF EXISTS "Admin can upload transaction documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update transaction documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete transaction documents" ON storage.objects;

CREATE POLICY "Admin can upload transaction documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'transaction-documents'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update transaction documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'transaction-documents'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete transaction documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'transaction-documents'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STORAGE BUCKET: announcement-attachments
-- ============================================================================

DROP POLICY IF EXISTS "Admin can upload announcement attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update announcement attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete announcement attachments" ON storage.objects;

CREATE POLICY "Admin can upload announcement attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can update announcement attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admin can delete announcement attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'announcement-attachments'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);
