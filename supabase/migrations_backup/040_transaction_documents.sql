-- Migration: Add transaction documents system
-- Description: Create document library for transactions with type categorization

-- ========================================
-- IMPORTANT: Storage Bucket Setup
-- ========================================
-- Before running this migration, ensure the 'documents' storage bucket exists.
-- Run in Supabase Dashboard > Storage:
--
-- 1. Create bucket: 'documents'
-- 2. Set bucket policy:
--    - Public: false
--    - File size limit: 52428800 (50MB)
--    - Allowed MIME types: application/pdf, application/msword,
--      application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--      text/plain, image/png, image/jpeg
--
-- 3. Storage policies (RLS):
--    - Users can upload to their own folder: bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
--    - Users can read their own files: bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
--    - Admins can access all: bucket_id = 'documents' AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
--
-- ========================================

-- Create transaction_documents table
CREATE TABLE IF NOT EXISTS transaction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT valid_document_type CHECK (
    document_type IN (
      'Fully Executed Contract',
      'CIS',
      'Dual Agency/Informed Consent',
      'SPD',
      'Lead-Based Paint Disclosure',
      'Proof of Deposit',
      'Commission Statement',
      'Final ALTA/CD',
      'Other'
    )
  )
);

-- Create index for faster queries
CREATE INDEX idx_transaction_documents_listing_id ON transaction_documents(listing_id);
CREATE INDEX idx_transaction_documents_uploaded_by ON transaction_documents(uploaded_by);
CREATE INDEX idx_transaction_documents_document_type ON transaction_documents(document_type);

-- Enable Row Level Security
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view documents for their own listings
CREATE POLICY "Users can view documents for their own listings"
  ON transaction_documents
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE agent_id = auth.uid()
    )
  );

-- RLS Policy: Users can upload documents for their own listings
CREATE POLICY "Users can upload documents for their own listings"
  ON transaction_documents
  FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE agent_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- RLS Policy: Users can delete their own uploaded documents
CREATE POLICY "Users can delete their own uploaded documents"
  ON transaction_documents
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- RLS Policy: Admins can view all documents
CREATE POLICY "Admins can view all transaction documents"
  ON transaction_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policy: Admins can manage all documents
CREATE POLICY "Admins can manage all transaction documents"
  ON transaction_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create view for document summary by listing
CREATE OR REPLACE VIEW transaction_documents_summary AS
SELECT
  listing_id,
  COUNT(*) as total_documents,
  COUNT(DISTINCT document_type) as document_types_count,
  ARRAY_AGG(DISTINCT document_type) as uploaded_types,
  MAX(uploaded_at) as last_upload
FROM transaction_documents
GROUP BY listing_id;

-- Grant permissions
GRANT SELECT ON transaction_documents_summary TO authenticated;
