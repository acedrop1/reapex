-- Remove broker role and replace with admin
-- This migration updates all RLS policies to only use 'agent' and 'admin' roles

-- Step 1: Update any existing users with broker role to admin
UPDATE public.users
SET role = 'admin'
WHERE role = 'broker';

-- Step 2: Drop and recreate all RLS policies that reference broker role

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

-- Recreate without broker
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all user profiles"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- LISTINGS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete listings" ON public.listings;

CREATE POLICY "Admins can manage all listings"
    ON public.listings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete listings"
    ON public.listings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;

CREATE POLICY "Admins can view all transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PAYOUTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payouts;

CREATE POLICY "Admins can view all payouts"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage payouts"
    ON public.payouts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- AGENT APPLICATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.agent_applications;

CREATE POLICY "Admins can view applications"
    ON public.agent_applications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update applications"
    ON public.agent_applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Admins can manage all notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Documents bucket
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

CREATE POLICY "Admins can upload documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Listing images bucket
DROP POLICY IF EXISTS "Admins can manage listing images" ON storage.objects;

CREATE POLICY "Admins can manage listing images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'listing-images' AND
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Training resources bucket
DROP POLICY IF EXISTS "Admins can upload training resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete training resources" ON storage.objects;

CREATE POLICY "Admins can upload training resources"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'training-resources' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete training resources"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'training-resources' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
