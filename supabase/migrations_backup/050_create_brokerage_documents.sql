-- Create brokerage_documents table for admin-managed documents
-- This replaces the "Access" section with "Brokerage Documents"

CREATE TABLE IF NOT EXISTS public.brokerage_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.brokerage_documents ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view visible documents
CREATE POLICY "Users can view visible brokerage documents"
  ON public.brokerage_documents
  FOR SELECT
  TO authenticated
  USING (is_visible = true);

-- Policy: Only admins can insert documents
CREATE POLICY "Only admins can insert brokerage documents"
  ON public.brokerage_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can update documents
CREATE POLICY "Only admins can update brokerage documents"
  ON public.brokerage_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can delete documents
CREATE POLICY "Only admins can delete brokerage documents"
  ON public.brokerage_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brokerage_documents_category
  ON public.brokerage_documents USING btree (category);

CREATE INDEX IF NOT EXISTS idx_brokerage_documents_uploaded_by
  ON public.brokerage_documents USING btree (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_brokerage_documents_is_visible
  ON public.brokerage_documents USING btree (is_visible);

CREATE INDEX IF NOT EXISTS idx_brokerage_documents_display_order
  ON public.brokerage_documents USING btree (display_order);

-- Add comments
COMMENT ON TABLE public.brokerage_documents IS 'Admin-managed brokerage documents accessible to all agents';
COMMENT ON COLUMN public.brokerage_documents.title IS 'Document title/name';
COMMENT ON COLUMN public.brokerage_documents.description IS 'Optional description of the document';
COMMENT ON COLUMN public.brokerage_documents.category IS 'Document category (forms, policies, training, compliance, other)';
COMMENT ON COLUMN public.brokerage_documents.file_url IS 'Storage path to the document file';
COMMENT ON COLUMN public.brokerage_documents.file_name IS 'Original filename';
COMMENT ON COLUMN public.brokerage_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.brokerage_documents.uploaded_by IS 'Admin user who uploaded the document';
COMMENT ON COLUMN public.brokerage_documents.display_order IS 'Order for displaying documents (lower numbers first)';
COMMENT ON COLUMN public.brokerage_documents.is_visible IS 'Whether document is visible to agents';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_brokerage_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brokerage_documents_updated_at
  BEFORE UPDATE ON public.brokerage_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brokerage_documents_updated_at();
