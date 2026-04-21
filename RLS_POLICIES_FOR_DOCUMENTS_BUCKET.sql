-- ============================================================================
-- RLS POLICIES FOR CONSOLIDATED DOCUMENTS BUCKET
-- ============================================================================
--
-- Purpose: Create folder-based RLS policies for the documents bucket
-- Folder Structure:
--   documents/
--   ├── marketing/    # Admin-only uploads (marketing assets, previews)
--   ├── forms/        # Admin-only uploads (brokerage forms, documents)
--   ├── training/     # Admin-only uploads (training videos, PDFs, thumbnails)
--   ├── logos/        # Admin-only uploads (external link logos)
--   └── {user-id}/    # User uploads (transaction documents)
--
-- Run this SQL in Supabase SQL Editor or Dashboard
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop old policies (cleanup)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "All authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to admin folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Delete based on folder ownership" ON storage.objects;
DROP POLICY IF EXISTS "Update based on folder ownership" ON storage.objects;

-- ============================================================================
-- STEP 2: Create new folder-based policies
-- ============================================================================

-- Policy 1: VIEW - All authenticated users can view all documents
CREATE POLICY "All authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
);

-- Policy 2: INSERT - Admins can upload to admin folders (marketing, forms, training, logos)
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
            AND users.role IN ('admin', 'admin_agent')
        )
    )
);

-- Policy 3: INSERT - Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    -- User ID folder structure: {user-id}/transactions/...
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: DELETE - Admins can delete from admin folders, users can delete own files
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
                AND users.role IN ('admin', 'admin_agent')
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
            AND users.role IN ('admin', 'admin_agent')
        )
    )
);

-- Policy 5: UPDATE - Admins can update admin folders, users can update own files
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
                AND users.role IN ('admin', 'admin_agent')
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
            AND users.role IN ('admin', 'admin_agent')
        )
    )
);

-- ============================================================================
-- STEP 3: Verify policies were created
-- ============================================================================

-- Run this query to verify all 5 policies exist:
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY cmd, policyname;

-- Expected output: 5 policies
--   DELETE: Delete based on folder ownership
--   INSERT: Admins can upload to admin folders
--   INSERT: Users can upload to own folder
--   SELECT: All authenticated users can view documents
--   UPDATE: Update based on folder ownership

-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================
