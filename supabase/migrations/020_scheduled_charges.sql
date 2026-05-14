-- Add plan_locked_until to users table (1-year plan commitment)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_locked_until TIMESTAMPTZ;

-- Scheduled & Recurring Charges table
CREATE TABLE IF NOT EXISTS scheduled_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, -- in cents
  description TEXT NOT NULL,
  charge_type TEXT NOT NULL CHECK (charge_type IN ('scheduled', 'recurring')),
  scheduled_date DATE, -- for one-time scheduled charges
  recurrence_interval TEXT CHECK (recurrence_interval IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  next_charge_date DATE, -- next date the charge will fire
  last_charged_at TIMESTAMPTZ, -- last time this was actually charged
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  total_charges_made INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE scheduled_charges ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage scheduled charges"
  ON scheduled_charges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Agents can view their own scheduled charges
CREATE POLICY "Agents can view own scheduled charges"
  ON scheduled_charges FOR SELECT
  USING (agent_id = auth.uid());
