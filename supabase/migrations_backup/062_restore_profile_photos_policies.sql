-- Migration: Restore ALL storage bucket policies
-- Description: Fix RLS policies that were accidentally deleted by migration 061
-- Migration 061 dropped ALL storage.objects policies, not just documents
-- This migration restores all the policies from migration 021
-- Created: 2025-12-01

-- Ensure all buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('profile-photos', 'profile-photos', true),
    ('brand-assets', 'brand-assets', true),
    ('training-resources', 'training-resources', true),
    ('marketing-files', 'marketing-files', false),
    ('support-attachments', 'support-attachments', false),
    ('announcement-files', 'announcement-files', true),
    ('agent-photos', 'agent-photos', true),
    ('listing-photos', 'listing-photos', true),
    ('agent-application-documents', 'agent-application-documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Drop existing policies to ensure clean state
DO $$
BEGIN
    -- profile-photos policies
    DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;

    -- brand-assets policies
    DROP POLICY IF EXISTS "Public can view brand assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload brand assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update brand assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete brand assets" ON storage.objects;

    -- training-resources policies
    DROP POLICY IF EXISTS "Public can view training resources" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload training resources" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update training resources" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete training resources" ON storage.objects;

    -- marketing-files policies
    DROP POLICY IF EXISTS "Agents can view own marketing files" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can upload own marketing files" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can delete own marketing files" ON storage.objects;

    -- support-attachments policies
    DROP POLICY IF EXISTS "Agents can view own support attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can upload own support attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can delete own support attachments" ON storage.objects;

    -- announcement-files policies
    DROP POLICY IF EXISTS "Public can view announcement files" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload announcement files" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete announcement files" ON storage.objects;

    -- agent-photos policies
    DROP POLICY IF EXISTS "Users can upload their own headshots" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own headshots" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own headshots" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view agent headshots" ON storage.objects;

    -- listing-photos policies
    DROP POLICY IF EXISTS "Agents can upload listing photos" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can update listing photos" ON storage.objects;
    DROP POLICY IF EXISTS "Agents can delete listing photos" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view listing photos" ON storage.objects;

    -- agent-application-documents policies
    DROP POLICY IF EXISTS "Public can upload application documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view application documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete application documents" ON storage.objects;
END $$;

-- ======================
-- PROFILE-PHOTOS POLICIES
-- ======================
CREATE POLICY "Public can view profile photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile photo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile photo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ======================
-- BRAND-ASSETS POLICIES
-- ======================
CREATE POLICY "Public can view brand assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins can upload brand assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can update brand assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete brand assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- ============================
-- TRAINING-RESOURCES POLICIES
-- ============================
CREATE POLICY "Public can view training resources"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'training-resources');

CREATE POLICY "Admins can upload training resources"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can update training resources"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete training resources"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- =========================
-- MARKETING-FILES POLICIES
-- =========================
CREATE POLICY "Agents can view own marketing files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'marketing-files' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

CREATE POLICY "Agents can upload own marketing files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'marketing-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Agents can delete own marketing files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'marketing-files' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

-- ==============================
-- SUPPORT-ATTACHMENTS POLICIES
-- ==============================
CREATE POLICY "Agents can view own support attachments"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'support-attachments' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

CREATE POLICY "Agents can upload own support attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'support-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Agents can delete own support attachments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'support-attachments' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

-- ============================
-- ANNOUNCEMENT-FILES POLICIES
-- ============================
CREATE POLICY "Public can view announcement files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'announcement-files');

CREATE POLICY "Admins can upload announcement files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'announcement-files' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete announcement files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'announcement-files' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- ======================
-- AGENT-PHOTOS POLICIES
-- ======================
CREATE POLICY "Public can view agent headshots"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'agent-photos');

CREATE POLICY "Users can upload their own headshots"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'agent-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own headshots"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'agent-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'agent-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own headshots"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'agent-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ========================
-- LISTING-PHOTOS POLICIES
-- ========================
CREATE POLICY "Public can view listing photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'listing-photos');

CREATE POLICY "Agents can upload listing photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Agents can update listing photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'listing-photos');

CREATE POLICY "Agents can delete listing photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'listing-photos');

-- =====================================
-- AGENT-APPLICATION-DOCUMENTS POLICIES
-- =====================================
-- Public can upload for application submissions
CREATE POLICY "Public can upload application documents"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'agent-application-documents');

-- Only admins can view application documents
CREATE POLICY "Admins can view application documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'agent-application-documents' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- Admins can delete application documents
CREATE POLICY "Admins can delete application documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'agent-application-documents' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );
