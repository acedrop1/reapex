-- Migration: Storage policies for documents bucket (direct approach)
-- Description: Configure storage policies without needing table ownership
-- Created: 2025-12-01
-- Run this in Supabase SQL Editor

-- First, remove all existing policies on documents bucket
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Policy 1: Public users can upload (for form submissions)
CREATE POLICY "Public can upload to documents bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'documents'
);

-- Policy 2: Authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
);

-- Policy 3: Admins and brokers can delete documents
CREATE POLICY "Admins and brokers can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
        SELECT id FROM public.users
        WHERE role IN ('admin', 'broker')
    )
);

-- Policy 4: Admins and brokers can update documents
CREATE POLICY "Admins and brokers can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
        SELECT id FROM public.users
        WHERE role IN ('admin', 'broker')
    )
)
WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
        SELECT id FROM public.users
        WHERE role IN ('admin', 'broker')
    )
);
