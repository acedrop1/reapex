-- ========================================
-- DIAGNOSTIC QUERIES FOR "BUCKET NOT FOUND" ERROR
-- ========================================
-- Run these in Supabase SQL Editor to diagnose the issue
-- ========================================

-- STEP 1: Verify 'documents' bucket exists
-- Expected: 1 row with id='documents', public=false
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'documents';

-- If this returns 0 rows, the bucket doesn't exist (despite screenshot)
-- If this returns 1 row, the bucket exists - issue is elsewhere

-- ========================================

-- STEP 2: Check storage RLS policies for documents bucket
-- Expected: 6 policies (3 for users, 3 for admins)
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as condition_preview
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY policyname;

-- If this returns 0 rows, RLS policies are missing
-- If returns < 6 rows, some policies are missing
-- Expected policies:
--   1. Admins can delete any documents
--   2. Admins can read any documents
--   3. Admins can upload any documents
--   4. Users can delete their own files
--   5. Users can read their own files
--   6. Users can upload to their own folder

-- ========================================

-- STEP 3: Check what file paths are stored in database
-- Expected: Paths like "user-id/transactions/transaction-id/timestamp.ext"
-- NOT like: "documents/user-id/..." (bucket name should NOT be in path)
SELECT
  id,
  document_type,
  file_name,
  file_url,
  LENGTH(file_url) as path_length,
  CASE
    WHEN file_url LIKE 'documents/%' THEN 'ERROR: Contains bucket name'
    WHEN file_url LIKE '%/%/%' THEN 'OK: Multi-level path'
    ELSE 'WARNING: Unexpected format'
  END as path_status,
  uploaded_by,
  created_at
FROM transaction_documents
ORDER BY created_at DESC
LIMIT 10;

-- ========================================

-- STEP 4: Check if uploaded_by user IDs exist in users table
-- Expected: All user IDs should have matching records
SELECT
  td.id as document_id,
  td.file_name,
  td.uploaded_by,
  CASE
    WHEN u.id IS NOT NULL THEN 'User exists'
    ELSE 'ERROR: User not found'
  END as user_status,
  u.email,
  u.role
FROM transaction_documents td
LEFT JOIN users u ON td.uploaded_by = u.id
ORDER BY td.created_at DESC
LIMIT 10;

-- If uploaded_by contains mock user ID '00000000-0000-0000-0000-000000000000'
-- but that user doesn't exist in database, RLS will fail

-- ========================================

-- STEP 5: Check for orphaned files in storage
-- This shows files in storage.objects that don't have database records
SELECT
  o.id,
  o.name as storage_path,
  o.bucket_id,
  o.created_at,
  CASE
    WHEN td.id IS NOT NULL THEN 'Has DB record'
    ELSE 'Orphaned (no DB record)'
  END as status
FROM storage.objects o
LEFT JOIN transaction_documents td ON td.file_url = o.name
WHERE o.bucket_id = 'documents'
ORDER BY o.created_at DESC
LIMIT 20;

-- ========================================

-- STEP 6: Test RLS policy evaluation for a specific user
-- Replace 'USER_ID_HERE' with actual user ID having issues
DO $$
DECLARE
  test_user_id UUID := 'USER_ID_HERE'::UUID; -- Replace with real user ID
  test_file_path TEXT := 'USER_ID_HERE/transactions/test/file.pdf'; -- Replace
  can_read BOOLEAN;
BEGIN
  -- Simulate RLS check for reading own files
  SELECT EXISTS (
    SELECT 1
    WHERE test_file_path LIKE test_user_id::text || '/%'
  ) INTO can_read;

  RAISE NOTICE 'User % can read file %: %', test_user_id, test_file_path, can_read;
END $$;

-- ========================================

-- STEP 7: Check for case sensitivity issues
-- Bucket names are case-sensitive
SELECT
  id,
  name,
  CASE
    WHEN id = 'documents' THEN 'Exact match ✓'
    WHEN LOWER(id) = 'documents' THEN 'Case mismatch!'
    ELSE 'Different bucket'
  END as match_status
FROM storage.buckets
WHERE LOWER(id) = 'documents' OR id = 'documents';

-- ========================================

-- SUMMARY QUERY: Overall system health
SELECT
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'documents') as buckets_found,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND qual::text LIKE '%documents%') as rls_policies,
  (SELECT COUNT(*) FROM transaction_documents) as total_documents,
  (SELECT COUNT(*) FROM transaction_documents WHERE file_url LIKE 'documents/%') as documents_with_bucket_in_path,
  (SELECT COUNT(DISTINCT uploaded_by) FROM transaction_documents) as unique_uploaders,
  (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'admin_agent', 'broker')) as admin_users;

-- Expected results:
--   buckets_found: 1
--   rls_policies: 6
--   total_documents: (any number)
--   documents_with_bucket_in_path: 0 (should be 0!)
--   unique_uploaders: (any number)
--   admin_users: (at least 1)
