-- Migration: Fix admin DELETE policies for resource tables
-- Description: Adds admin_agent role to DELETE policies and creates missing policies for training_resources
-- This fixes the issue where admins cannot delete resources in /admin/manage-resources

-- ===================================================================
-- 1. Fix brokerage_documents DELETE policy to include admin_agent
-- ===================================================================
DROP POLICY IF EXISTS "Only admins can delete brokerage documents" ON public.brokerage_documents;

CREATE POLICY "Admins can delete brokerage documents"
    ON public.brokerage_documents
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- ===================================================================
-- 2. Add missing INSERT, UPDATE, DELETE policies for training_resources
-- ===================================================================

-- Currently training_resources only has SELECT policy
-- Adding full admin management policies

CREATE POLICY "Admins can insert training resources"
    ON public.training_resources
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

CREATE POLICY "Admins can update training resources"
    ON public.training_resources
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

CREATE POLICY "Admins can delete training resources"
    ON public.training_resources
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- ===================================================================
-- 3. Fix canva_templates policy to include admin_agent
-- ===================================================================
DROP POLICY IF EXISTS "Admins can manage templates" ON public.canva_templates;

CREATE POLICY "Admins can manage templates"
    ON public.canva_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- ===================================================================
-- 4. Fix external_links DELETE policy to include admin_agent
-- ===================================================================
DROP POLICY IF EXISTS "Admins can delete external links" ON public.external_links;

CREATE POLICY "Admins can delete external links"
    ON public.external_links
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- Also update other external_links admin policies for consistency
DROP POLICY IF EXISTS "Admins can create external links" ON public.external_links;
DROP POLICY IF EXISTS "Admins can update external links" ON public.external_links;

CREATE POLICY "Admins can create external links"
    ON public.external_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

CREATE POLICY "Admins can update external links"
    ON public.external_links
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    );

-- Verification: Check all policies are in place
-- Expected results:
-- brokerage_documents: SELECT (public), INSERT/UPDATE/DELETE (admin/admin_agent)
-- training_resources: SELECT (public), INSERT/UPDATE/DELETE (admin/admin_agent)
-- canva_templates: SELECT (public), ALL (admin/admin_agent)
-- external_links: SELECT (public/admin), INSERT/UPDATE/DELETE (admin/admin_agent)
