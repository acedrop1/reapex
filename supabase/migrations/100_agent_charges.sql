-- Agent Charges table for admin billing
CREATE TABLE IF NOT EXISTS agent_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, -- amount in cents
  description TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  receipt_sent BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_charges_agent_id ON agent_charges(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_charges_status ON agent_charges(status);
CREATE INDEX IF NOT EXISTS idx_agent_charges_created_at ON agent_charges(created_at DESC);

-- RLS
ALTER TABLE agent_charges ENABLE ROW LEVEL SECURITY;

-- Admins can see and create all charges
CREATE POLICY "Admins can manage agent charges"
  ON agent_charges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'broker')
    )
  );

-- Agents can see their own charges
CREATE POLICY "Agents can view own charges"
  ON agent_charges FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
