-- Migration: Create document access audit log
-- Description: Track who views/downloads brokerage documents
-- Created: 2025-12-01

-- Create document_access_logs table
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.brokerage_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id
  ON public.document_access_logs USING btree (document_id);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id
  ON public.document_access_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at
  ON public.document_access_logs USING btree (accessed_at DESC);

-- Add RLS policies
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own access logs" ON public.document_access_logs;
DROP POLICY IF EXISTS "Admins can view all access logs" ON public.document_access_logs;

-- Policy: Users can insert their own access logs
CREATE POLICY "Users can insert their own access logs"
  ON public.document_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Only admins can view access logs
CREATE POLICY "Admins can view all access logs"
  ON public.document_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.document_access_logs IS 'Audit log tracking document views and downloads';
COMMENT ON COLUMN public.document_access_logs.action_type IS 'Type of access: view or download';
COMMENT ON COLUMN public.document_access_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN public.document_access_logs.user_agent IS 'Browser user agent string';
