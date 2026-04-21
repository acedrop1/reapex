-- Fix RLS policies for admin resource management
-- Ensure admins can full manage: external_links, brokerage_documents, training_resources, canva_templates

-- =============================================================================
-- EXTERNAL LINKS
-- =============================================================================
DROP POLICY IF EXISTS "Admins can create external links" ON public.external_links;
DROP POLICY IF EXISTS "Admins can update external links" ON public.external_links;
DROP POLICY IF EXISTS "Admins can delete external links" ON public.external_links;

CREATE POLICY "Admins can insert external links"
    ON public.external_links FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can update external links"
    ON public.external_links FOR UPDATE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can delete external links"
    ON public.external_links FOR DELETE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

-- =============================================================================
-- BROKERAGE DOCUMENTS (Forms)
-- =============================================================================
DROP POLICY IF EXISTS "Admins can manage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.brokerage_documents;

CREATE POLICY "Admins can insert documents"
    ON public.brokerage_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can update documents"
    ON public.brokerage_documents FOR UPDATE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can delete documents"
    ON public.brokerage_documents FOR DELETE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

-- =============================================================================
-- TRAINING RESOURCES
-- =============================================================================
DROP POLICY IF EXISTS "Admins can manage training" ON public.training_resources;
DROP POLICY IF EXISTS "Admins can insert training" ON public.training_resources;
DROP POLICY IF EXISTS "Admins can update training" ON public.training_resources;
DROP POLICY IF EXISTS "Admins can delete training" ON public.training_resources;

CREATE POLICY "Admins can insert training"
    ON public.training_resources FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can update training"
    ON public.training_resources FOR UPDATE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can delete training"
    ON public.training_resources FOR DELETE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

-- =============================================================================
-- MARKETING TEMPLATES (Canva)
-- =============================================================================
DROP POLICY IF EXISTS "Admins can manage templates" ON public.canva_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.canva_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.canva_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.canva_templates;

CREATE POLICY "Admins can insert templates"
    ON public.canva_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can update templates"
    ON public.canva_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );

CREATE POLICY "Admins can delete templates"
    ON public.canva_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin' )
    );
