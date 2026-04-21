-- ========================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- ========================================
-- Purpose: Create missing 'documents' storage bucket and RLS policies
-- Issue: Agents getting "Bucket not found" error when viewing documents
-- Date: 2025-12-22
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify success in Storage > Documents bucket appears
-- 5. Test document upload/view functionality
-- ========================================

-- Step 1: Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket, not publicly accessible
  52428800, -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

-- Step 2: Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload any documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read any documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any documents" ON storage.objects;

-- Step 3: Create RLS policies for regular users (agents)

-- Policy: Users can upload files to their own folder in documents bucket
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read files from their own folder in documents bucket
CREATE POLICY "Users can read their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete files from their own folder in documents bucket
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Step 4: Create RLS policies for admin-level users (admin, admin_agent, broker)

-- Policy: Admins can upload to any folder in documents bucket
CREATE POLICY "Admins can upload any documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent', 'broker')
    )
  );

-- Policy: Admins can read any files in documents bucket
CREATE POLICY "Admins can read any documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent', 'broker')
    )
  );

-- Policy: Admins can delete any files in documents bucket
CREATE POLICY "Admins can delete any documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent', 'broker')
    )
  );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the bucket and policies were created:

-- 1. Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- 2. Verify policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%document%'
ORDER BY policyname;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- Bucket query should return 1 row with:
--   id: documents
--   name: documents
--   public: false
--   file_size_limit: 52428800
--
-- Policies query should return 6 rows:
--   1. Admins can delete any documents
--   2. Admins can read any documents
--   3. Admins can upload any documents
--   4. Users can delete their own files
--   5. Users can read their own files
--   6. Users can upload to their own folder
-- ========================================
