-- Migration: Consolidated documents bucket policies using support-attachments pattern
-- Issue: Simplify documents bucket policies by consolidating user + admin logic
-- Pattern: Same as support-attachments bucket (proven working pattern)

-- Drop existing user-specific policies (if they exist)
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Drop existing admin-specific policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and brokers can update documents" ON storage.objects;

-- Drop old authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

-- Policy 1: Agents can view own documents, admins/brokers can view all
-- Pattern: Users can view files in their own folder OR if they're admin/broker
CREATE POLICY "Agents can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
);

-- Policy 2: Agents can upload to their own folder only
-- Pattern: File path must start with user's ID
CREATE POLICY "Agents can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Agents can delete own documents, admins/brokers can delete all
-- Pattern: Users can delete files in their own folder OR if they're admin/broker
CREATE POLICY "Agents can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
);

-- Policy 4: Agents can update own documents, admins/brokers can update all
-- Pattern: Users can update files in their own folder OR if they're admin/broker
CREATE POLICY "Agents can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
);

-- Comments explaining the pattern
COMMENT ON POLICY "Agents can view own documents" ON storage.objects IS
  'Allows agents to view files in their own folder. Admins, admin_agents, and brokers can view all documents.';

COMMENT ON POLICY "Agents can upload own documents" ON storage.objects IS
  'Allows agents to upload files to their own folder only. First folder in path must match user ID.';

COMMENT ON POLICY "Agents can delete own documents" ON storage.objects IS
  'Allows agents to delete files from their own folder. Admins, admin_agents, and brokers can delete all documents.';

COMMENT ON POLICY "Agents can update own documents" ON storage.objects IS
  'Allows agents to update files in their own folder. Admins, admin_agents, and brokers can update all documents.';
