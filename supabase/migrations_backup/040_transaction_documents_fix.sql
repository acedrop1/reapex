-- Migration: Fix transaction documents RLS policies
-- Description: Update RLS policies to allow proper document uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view documents for their own listings" ON transaction_documents;
DROP POLICY IF EXISTS "Users can upload documents for their own listings" ON transaction_documents;
DROP POLICY IF EXISTS "Users can delete their own uploaded documents" ON transaction_documents;
DROP POLICY IF EXISTS "Admins can view all transaction documents" ON transaction_documents;
DROP POLICY IF EXISTS "Admins can manage all transaction documents" ON transaction_documents;

-- Create new, simplified policies

-- Policy: Authenticated users can upload documents (application will validate listing ownership)
CREATE POLICY "Authenticated users can upload documents"
  ON transaction_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can view documents they uploaded
CREATE POLICY "Users can view their uploaded documents"
  ON transaction_documents
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Users can delete documents they uploaded
CREATE POLICY "Users can delete their uploaded documents"
  ON transaction_documents
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON transaction_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can insert documents
CREATE POLICY "Admins can insert documents"
  ON transaction_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete any document
CREATE POLICY "Admins can delete any document"
  ON transaction_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
