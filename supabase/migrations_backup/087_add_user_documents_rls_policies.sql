-- Migration: Add missing RLS policies for regular users (agents) on documents bucket
-- Issue: Agents getting "Bucket not found" when uploading because INSERT policy is missing
-- Root Cause: Migrations 060 and 061 removed user-specific INSERT/DELETE policies from migration 041
-- Solution: Re-add user-specific policies that were removed

-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Policy 1: Allow agents to upload files to their own folder
-- File path structure: {user_id}/transactions/{transaction_id}/{filename}
-- The first folder in the path must match the authenticated user's ID
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow agents to delete files from their own folder
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow agents to update files in their own folder
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: SELECT policy already exists as "Authenticated users can view documents"
-- It allows any authenticated user to view all documents in the bucket
-- This is acceptable for this use case where admins need to view agent documents

COMMENT ON POLICY "Users can upload to their own folder" ON storage.objects IS
  'Allows agents to upload files to their own folder in the documents bucket. First folder in path must match user ID.';

COMMENT ON POLICY "Users can delete their own files" ON storage.objects IS
  'Allows agents to delete files from their own folder in the documents bucket. First folder in path must match user ID.';

COMMENT ON POLICY "Users can update their own files" ON storage.objects IS
  'Allows agents to update files in their own folder in the documents bucket. First folder in path must match user ID.';
