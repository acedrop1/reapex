-- Migration: Agent Agreements System
-- Created: 2025-12-14
-- Purpose: Create agent_agreements table and storage bucket for agent-specific documents

-- Create agent_agreements table
CREATE TABLE IF NOT EXISTS agent_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  is_required BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_agreements_agent_id ON agent_agreements(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_agreements_status ON agent_agreements(status);
CREATE INDEX IF NOT EXISTS idx_agent_agreements_uploaded_by ON agent_agreements(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_agent_agreements_document_type ON agent_agreements(document_type);

-- Enable RLS
ALTER TABLE agent_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Agents can view their own agreements
CREATE POLICY "Agents can view own agreements"
ON agent_agreements FOR SELECT
USING (auth.uid() = agent_id);

-- Agents can insert their own agreements
CREATE POLICY "Agents can insert own agreements"
ON agent_agreements FOR INSERT
WITH CHECK (auth.uid() = agent_id);

-- Agents can update their own agreements
CREATE POLICY "Agents can update own agreements"
ON agent_agreements FOR UPDATE
USING (auth.uid() = agent_id);

-- Agents can delete their own agreements
CREATE POLICY "Agents can delete own agreements"
ON agent_agreements FOR DELETE
USING (auth.uid() = agent_id);

-- Admins and brokers have full access
CREATE POLICY "Admins have full access to agreements"
ON agent_agreements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'broker')
  )
);

-- Storage Bucket Setup

-- Create agent-agreements bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-agreements', 'agent-agreements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Agents can upload their own files
CREATE POLICY "Agents can upload own agreement files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-agreements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Agents can read their own files
CREATE POLICY "Agents can read own agreement files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-agreements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Agents can update their own files
CREATE POLICY "Agents can update own agreement files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agent-agreements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Agents can delete their own files
CREATE POLICY "Agents can delete own agreement files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agent-agreements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins and brokers have full access to storage
CREATE POLICY "Admins have full access to agreement storage"
ON storage.objects FOR ALL
USING (
  bucket_id = 'agent-agreements'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'broker')
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_agreements_updated_at
BEFORE UPDATE ON agent_agreements
FOR EACH ROW
EXECUTE FUNCTION update_agent_agreements_updated_at();

-- Comments for documentation
COMMENT ON TABLE agent_agreements IS 'Stores agent-specific agreements and documents';
COMMENT ON COLUMN agent_agreements.agent_id IS 'Reference to the agent (user) this agreement belongs to';
COMMENT ON COLUMN agent_agreements.document_type IS 'Type of document (ICA Agreement, Commission Plan, etc.)';
COMMENT ON COLUMN agent_agreements.uploaded_by IS 'User who uploaded the document (agent or admin)';
COMMENT ON COLUMN agent_agreements.is_required IS 'Whether this document is required for agent compliance';
COMMENT ON COLUMN agent_agreements.expires_at IS 'Optional expiration date for the document';
COMMENT ON COLUMN agent_agreements.status IS 'Status of the agreement (active, archived, expired)';
