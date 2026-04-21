-- Migration: Add file attachment support to CRM contacts
-- Description: Adds file attachment columns and storage bucket for contact documents
-- Created: 2026-02-18
-- Issue: CRM contacts need file attachment capability (documents, PDFs, images, etc.)

-- Add file attachment columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS attachment_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS attachment_metadata JSONB DEFAULT '{}'::JSONB;

-- Create storage bucket for contact documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-documents',
  'contact-documents',
  false, -- Private bucket - only accessible by contact owner
  52428800, -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Agents can view own contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any contact documents" ON storage.objects;

-- RLS Policy: Agents can view files for their own contacts
-- Folder structure: contact-documents/{contact_id}/{filename}
CREATE POLICY "Agents can view own contact documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contact-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.contacts WHERE agent_id = auth.uid()
    )
  );

-- RLS Policy: Agents can upload files for their own contacts
CREATE POLICY "Agents can upload contact documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contact-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.contacts WHERE agent_id = auth.uid()
    )
  );

-- RLS Policy: Agents can update files for their own contacts
CREATE POLICY "Agents can update contact documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contact-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.contacts WHERE agent_id = auth.uid()
    )
  );

-- RLS Policy: Agents can delete files from their own contacts
CREATE POLICY "Agents can delete own contact documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contact-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.contacts WHERE agent_id = auth.uid()
    )
  );

-- RLS Policy: Admins can view all contact documents
CREATE POLICY "Admins can view all contact documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contact-documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Admins can delete any contact documents
CREATE POLICY "Admins can delete any contact documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contact-documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON COLUMN contacts.file_urls IS 'Array of Supabase storage URLs for attached files';
COMMENT ON COLUMN contacts.attachment_names IS 'Array of original filenames for attached files (matches file_urls index)';
COMMENT ON COLUMN contacts.attachment_metadata IS 'JSONB object storing file metadata (size, type, upload date, etc.) keyed by file URL';

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Contact file attachments migration complete';
  RAISE NOTICE 'Bucket: contact-documents (50MB limit, private)';
  RAISE NOTICE 'RLS policies: Agent access to own contacts, admin access to all';
END $$;
