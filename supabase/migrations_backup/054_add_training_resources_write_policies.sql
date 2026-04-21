-- Migration: Add INSERT/UPDATE/DELETE policies for training_resources
-- Description: Allows admins and brokers to manage training resources
-- Created: 2025-12-01

-- ============================================
-- Training Resources Write Policies
-- ============================================

-- Allow admins and brokers to insert training resources
CREATE POLICY "Admins and brokers can insert training resources"
    ON public.training_resources FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin_or_broker()
    );

-- Allow admins and brokers to update training resources
CREATE POLICY "Admins and brokers can update training resources"
    ON public.training_resources FOR UPDATE
    TO authenticated
    USING (
        is_admin_or_broker()
    )
    WITH CHECK (
        is_admin_or_broker()
    );

-- Allow admins and brokers to delete training resources
CREATE POLICY "Admins and brokers can delete training resources"
    ON public.training_resources FOR DELETE
    TO authenticated
    USING (
        is_admin_or_broker()
    );

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Admins and brokers can insert training resources" ON public.training_resources
    IS 'Allows admins and brokers to create new training resources';

COMMENT ON POLICY "Admins and brokers can update training resources" ON public.training_resources
    IS 'Allows admins and brokers to update existing training resources';

COMMENT ON POLICY "Admins and brokers can delete training resources" ON public.training_resources
    IS 'Allows admins and brokers to delete training resources';
