-- Migration: Fix documents storage bucket policies
-- Description: Add proper RLS policies for documents storage bucket
-- Created: 2025-12-01

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload documents" ON storage.objects;

-- Policy: Anyone can upload to documents bucket (for form submissions)
CREATE POLICY "Anyone can upload documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');

-- Policy: Only authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Policy: Admins and brokers can delete documents
CREATE POLICY "Admins and brokers can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'broker')
      )
    )
  );

-- Policy: Admins and brokers can update documents
CREATE POLICY "Admins and brokers can update documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'broker')
      )
    )
  );
