-- Update transaction_documents table to support independent transactions
-- Make listing_id optional and add transaction_id column

-- Add transaction_id column
ALTER TABLE public.transaction_documents
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Make listing_id nullable (optional)
ALTER TABLE public.transaction_documents
ALTER COLUMN listing_id DROP NOT NULL;

-- Add constraint to ensure either listing_id or transaction_id is provided
ALTER TABLE public.transaction_documents
ADD CONSTRAINT listing_or_transaction_required
CHECK (listing_id IS NOT NULL OR transaction_id IS NOT NULL);

-- Create index for transaction_id
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id ON public.transaction_documents(transaction_id);

-- Update RLS policies to support both listings and transactions

-- Drop old policies
DROP POLICY IF EXISTS "Users can view documents for their own listings" ON transaction_documents;
DROP POLICY IF EXISTS "Users can upload documents for their own listings" ON transaction_documents;

-- New policy: Users can view documents for their own listings or transactions
CREATE POLICY "Users can view their documents"
  ON transaction_documents
  FOR SELECT
  USING (
    (listing_id IN (
      SELECT id FROM listings WHERE agent_id = auth.uid()
    ))
    OR
    (transaction_id IN (
      SELECT id FROM transactions WHERE agent_id = auth.uid()
    ))
  );

-- New policy: Users can upload documents for their own listings or transactions
CREATE POLICY "Users can upload their documents"
  ON transaction_documents
  FOR INSERT
  WITH CHECK (
    (
      listing_id IN (
        SELECT id FROM listings WHERE agent_id = auth.uid()
      )
      OR
      transaction_id IN (
        SELECT id FROM transactions WHERE agent_id = auth.uid()
      )
    )
    AND uploaded_by = auth.uid()
  );

-- Update the summary view
DROP VIEW IF EXISTS transaction_documents_summary;

CREATE OR REPLACE VIEW transaction_documents_summary AS
SELECT
  listing_id,
  transaction_id,
  COUNT(*) as total_documents,
  COUNT(DISTINCT document_type) as document_types_count,
  ARRAY_AGG(DISTINCT document_type) as uploaded_types,
  MAX(uploaded_at) as last_upload
FROM transaction_documents
GROUP BY listing_id, transaction_id;

-- Grant permissions
GRANT SELECT ON transaction_documents_summary TO authenticated;

-- Add comment
COMMENT ON COLUMN transaction_documents.transaction_id IS 'Reference to transaction - either listing_id or transaction_id must be provided';
COMMENT ON COLUMN transaction_documents.listing_id IS 'Optional reference to listing - either listing_id or transaction_id must be provided';
