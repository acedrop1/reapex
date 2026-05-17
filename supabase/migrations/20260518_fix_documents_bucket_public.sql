-- Fix documents storage bucket: make it public so getPublicUrl() works
-- ROOT CAUSE: Bucket was created with public=false, so all icon/image URLs 404
-- This prevented any uploaded icons from displaying in the admin panel or agent dashboard

-- Make bucket public (files are still protected by RLS for upload/delete/update operations)
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Also add webp and svg to allowed mime types (the icon dropzone accepts these)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml'
]
WHERE id = 'documents';

-- Ensure there is a public SELECT policy for the documents bucket
-- (allows anyone to view/download files via public URL)
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');
