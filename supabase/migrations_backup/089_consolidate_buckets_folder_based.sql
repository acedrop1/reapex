-- Migration: Consolidate storage buckets with folder-based RLS
-- Purpose: Move all admin-managed content to 'documents' bucket with folder structure
--
-- New folder structure in 'documents' bucket:
-- ├── marketing/          # Admin-only (from marketing-files bucket)
-- ├── forms/             # Admin-only (brokerage forms)
-- ├── training/          # Admin-only (from training-resources bucket)
-- ├── logos/             # Admin-only (from external-links bucket)
-- ├── {user-id}/         # User can write to own folder
--     └── transactions/ # Transaction documents

-- ============================================
-- STEP 1: Drop old bucket-specific policies
-- ============================================

-- Drop all existing documents policies (we'll recreate with folder-based logic)
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can update documents" ON storage.objects;

-- ============================================
-- STEP 2: Create folder-based RLS policies
-- ============================================

-- Policy 1: Everyone can VIEW all documents
CREATE POLICY "All authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
);

-- Policy 2: Admins can UPLOAD to admin folders (marketing, forms, training, logos)
CREATE POLICY "Admins can upload to admin folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (
        -- Admin folders
        (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'admin_agent', 'broker')
        )
    )
);

-- Policy 3: Users can UPLOAD to their own user folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    -- User ID folder structure: {user-id}/transactions/...
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Admins can DELETE from admin folders, users can delete own files
CREATE POLICY "Delete based on folder ownership"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (
        -- Admins can delete from admin folders
        (
            (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent', 'broker')
            )
        )
        OR
        -- Users can delete from their own folder
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Admins can delete from any user folder
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'admin_agent', 'broker')
        )
    )
);

-- Policy 5: Admins can UPDATE admin folders, users can update own files
CREATE POLICY "Update based on folder ownership"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (
        -- Admins can update admin folders
        (
            (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent', 'broker')
            )
        )
        OR
        -- Users can update their own folder
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Admins can update any user folder
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'admin_agent', 'broker')
        )
    )
);

-- ============================================
-- STEP 3: Add policy comments
-- ============================================

COMMENT ON POLICY "All authenticated users can view documents" ON storage.objects IS
  'All authenticated users can view all documents in all folders';

COMMENT ON POLICY "Admins can upload to admin folders" ON storage.objects IS
  'Admins can upload to marketing/, forms/, training/, logos/ folders';

COMMENT ON POLICY "Users can upload to own folder" ON storage.objects IS
  'Users can upload to {user-id}/ folder (e.g., for transaction documents)';

COMMENT ON POLICY "Delete based on folder ownership" ON storage.objects IS
  'Admins can delete from admin folders and any user folder. Users can delete from their own folder.';

COMMENT ON POLICY "Update based on folder ownership" ON storage.objects IS
  'Admins can update admin folders and any user folder. Users can update their own folder.';

-- ============================================
-- STEP 4: Update bucket configurations
-- ============================================

-- Ensure documents bucket has appropriate file size limit and MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  104857600, -- 100MB file size limit
  ARRAY[
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    -- Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    -- Design files
    'application/illustrator',
    'application/postscript'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'application/illustrator',
    'application/postscript'
  ];

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify setup:

-- 1. Check documents bucket configuration
-- SELECT * FROM storage.buckets WHERE id = 'documents';

-- 2. Check all policies for documents bucket
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'objects'
-- AND schemaname = 'storage'
-- AND qual::text LIKE '%documents%'
-- ORDER BY cmd, policyname;

-- Expected: 5 policies
--   DELETE: Delete based on folder ownership
--   INSERT: Admins can upload to admin folders
--   INSERT: Users can upload to own folder
--   SELECT: All authenticated users can view documents
--   UPDATE: Update based on folder ownership
