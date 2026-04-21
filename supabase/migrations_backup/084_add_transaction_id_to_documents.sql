-- Add transaction_id column to transaction_documents table
-- This allows documents to be associated with transactions directly

-- Add transaction_id column (nullable initially for existing records)
ALTER TABLE transaction_documents
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Make listing_id nullable since documents can now be associated with transactions directly
ALTER TABLE transaction_documents
ALTER COLUMN listing_id DROP NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id
ON transaction_documents(transaction_id);

-- Update RLS policies to include transaction_id
DROP POLICY IF EXISTS "Users can view documents for their own transactions" ON transaction_documents;
CREATE POLICY "Users can view documents for their own transactions"
  ON transaction_documents
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE agent_id = auth.uid()
    )
    OR
    listing_id IN (
      SELECT id FROM listings WHERE agent_id = auth.uid()
    )
  );

-- Update INSERT policy to allow transaction_id based uploads
DROP POLICY IF EXISTS "Users can upload documents for their own listings" ON transaction_documents;
CREATE POLICY "Users can upload documents for their own transactions or listings"
  ON transaction_documents
  FOR INSERT
  WITH CHECK (
    (
      transaction_id IN (
        SELECT id FROM transactions WHERE agent_id = auth.uid()
      )
      OR
      listing_id IN (
        SELECT id FROM listings WHERE agent_id = auth.uid()
      )
    )
    AND uploaded_by = auth.uid()
  );

-- Add constraint to ensure either listing_id or transaction_id is provided
ALTER TABLE transaction_documents
ADD CONSTRAINT transaction_documents_ref_check
CHECK (listing_id IS NOT NULL OR transaction_id IS NOT NULL);

-- Comment
COMMENT ON COLUMN transaction_documents.transaction_id IS 'Optional reference to transaction for direct document association';
COMMENT ON COLUMN transaction_documents.listing_id IS 'Optional reference to listing (nullable when using transaction_id)';
