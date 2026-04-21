-- Create contact_communications table for tracking contact interactions
CREATE TABLE IF NOT EXISTS contact_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'message', 'meeting', 'note')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),
  subject TEXT,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by contact
CREATE INDEX idx_contact_communications_contact_id ON contact_communications(contact_id);

-- Create index for faster sorting by date
CREATE INDEX idx_contact_communications_occurred_at ON contact_communications(occurred_at DESC);

-- Create index for filtering by type
CREATE INDEX idx_contact_communications_type ON contact_communications(type);

-- Enable RLS
ALTER TABLE contact_communications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view communications for their own contacts
CREATE POLICY "Users can view their own contact communications"
  ON contact_communications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_communications.contact_id
      AND contacts.agent_id = auth.uid()
    )
  );

-- Policy: Users can create communications for their own contacts
CREATE POLICY "Users can create communications for their own contacts"
  ON contact_communications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_communications.contact_id
      AND contacts.agent_id = auth.uid()
    )
  );

-- Policy: Users can update their own communications
CREATE POLICY "Users can update their own communications"
  ON contact_communications
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Users can delete their own communications
CREATE POLICY "Users can delete their own communications"
  ON contact_communications
  FOR DELETE
  USING (created_by = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_communications_updated_at
  BEFORE UPDATE ON contact_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_communications_updated_at();
