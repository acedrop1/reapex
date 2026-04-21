-- Migration: Fix and consolidate all RLS policies for transactions system
-- Description: Ensure proper RLS policies for transactions, transaction_documents, and storage

-- ========================================
-- TRANSACTIONS TABLE RLS
-- ========================================

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Agents can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Agents can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Agents can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Agents can delete their own transactions" ON public.transactions;

-- Policy: Agents can view their own transactions
CREATE POLICY "Agents can view their own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Policy: Agents can create their own transactions
CREATE POLICY "Agents can create their own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Policy: Agents can update their own transactions
CREATE POLICY "Agents can update their own transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Policy: Admins can update all transactions
CREATE POLICY "Admins can update all transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Policy: Agents can delete their own transactions
CREATE POLICY "Agents can delete their own transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

-- ========================================
-- TRANSACTION DOCUMENTS TABLE RLS
-- ========================================

-- Enable RLS on transaction_documents table
ALTER TABLE public.transaction_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their documents" ON public.transaction_documents;
DROP POLICY IF EXISTS "Users can upload their documents" ON public.transaction_documents;
DROP POLICY IF EXISTS "Users can delete their own uploaded documents" ON public.transaction_documents;
DROP POLICY IF EXISTS "Admins can view all transaction documents" ON public.transaction_documents;
DROP POLICY IF EXISTS "Admins can manage all transaction documents" ON public.transaction_documents;

-- Policy: Users can view documents for their own listings or transactions
CREATE POLICY "Users can view their documents"
  ON public.transaction_documents
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR
    (listing_id IN (
      SELECT id FROM public.listings WHERE agent_id = auth.uid()
    ))
    OR
    (transaction_id IN (
      SELECT id FROM public.transactions WHERE agent_id = auth.uid()
    ))
  );

-- Policy: Users can upload documents for their own listings or transactions
CREATE POLICY "Users can upload their documents"
  ON public.transaction_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND
    (
      listing_id IN (
        SELECT id FROM public.listings WHERE agent_id = auth.uid()
      )
      OR
      transaction_id IN (
        SELECT id FROM public.transactions WHERE agent_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete their own uploaded documents
CREATE POLICY "Users can delete their own uploaded documents"
  ON public.transaction_documents
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all transaction documents"
  ON public.transaction_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Policy: Admins can manage all documents
CREATE POLICY "Admins can manage all transaction documents"
  ON public.transaction_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- ========================================
-- STORAGE BUCKET RLS
-- ========================================

-- Note: Storage policies should already be set up from migration 041
-- Verify they exist and are correct

-- Drop and recreate storage policies to ensure consistency
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload any documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read any documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any documents" ON storage.objects;

-- Policy: Users can upload files to their own folder in documents bucket
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read files from their own folder in documents bucket
CREATE POLICY "Users can read their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete files from their own folder in documents bucket
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can upload to any folder in documents bucket
CREATE POLICY "Admins can upload any documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'broker')
    )
  );

-- Policy: Admins can read any files in documents bucket
CREATE POLICY "Admins can read any documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'broker')
    )
  );

-- Policy: Admins can delete any files in documents bucket
CREATE POLICY "Admins can delete any documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'broker')
    )
  );

-- ========================================
-- VERIFY SETUP
-- ========================================

-- Verify storage bucket exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    RAISE NOTICE 'WARNING: documents bucket does not exist. Run migration 041_create_documents_storage.sql first.';
  END IF;
END $$;
