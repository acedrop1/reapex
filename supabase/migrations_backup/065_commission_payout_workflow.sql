-- Commission Payout Approval Workflow
-- When broker closes transaction, admin reviews and approves final commission

-- Create commission status enum
CREATE TYPE commission_status AS ENUM ('pending_approval', 'approved', 'paid');

-- Add commission payout workflow fields to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS commission_status commission_status DEFAULT 'pending_approval',
ADD COLUMN IF NOT EXISTS final_commission_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS brokerage_split_percentage DECIMAL(5, 2) CHECK (brokerage_split_percentage IN (80, 90, 100)),
ADD COLUMN IF NOT EXISTS brokerage_fees JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS agent_net_payout DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- Add comments
COMMENT ON COLUMN public.transactions.commission_status IS 'Status of commission payout: pending_approval (broker closed, awaiting admin), approved (admin approved), paid (physical check issued)';
COMMENT ON COLUMN public.transactions.final_commission_amount IS 'Final commission amount set by admin after review';
COMMENT ON COLUMN public.transactions.brokerage_split_percentage IS 'Agent split percentage: 80%, 90%, or 100% (no split)';
COMMENT ON COLUMN public.transactions.brokerage_fees IS 'Array of fees: [{name: "Transaction Fee", amount: 250}, {name: "E&O Insurance", amount: 100}]';
COMMENT ON COLUMN public.transactions.agent_net_payout IS 'Final payout to agent: (final_commission * split%) - total_fees';
COMMENT ON COLUMN public.transactions.approved_by IS 'Admin who approved the commission payout';
COMMENT ON COLUMN public.transactions.approved_at IS 'Timestamp when commission was approved';
COMMENT ON COLUMN public.transactions.payout_notes IS 'Admin notes about the payout';

-- Create index for commission status queries
CREATE INDEX IF NOT EXISTS idx_transactions_commission_status ON public.transactions(commission_status);

-- Create function to calculate agent net payout
CREATE OR REPLACE FUNCTION calculate_agent_net_payout(
  p_final_commission DECIMAL(12, 2),
  p_split_percentage DECIMAL(5, 2),
  p_fees JSONB
)
RETURNS DECIMAL(12, 2)
AS $$
DECLARE
  v_total_fees DECIMAL(12, 2) := 0;
  v_fee JSONB;
  v_agent_gross DECIMAL(12, 2);
BEGIN
  -- Calculate total fees
  FOR v_fee IN SELECT jsonb_array_elements(p_fees)
  LOOP
    v_total_fees := v_total_fees + COALESCE((v_fee->>'amount')::DECIMAL(12, 2), 0);
  END LOOP;

  -- Calculate agent gross from split
  v_agent_gross := p_final_commission * (p_split_percentage / 100);

  -- Return net payout (gross - fees)
  RETURN v_agent_gross - v_total_fees;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate agent_net_payout
CREATE OR REPLACE FUNCTION update_agent_net_payout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.final_commission_amount IS NOT NULL AND NEW.brokerage_split_percentage IS NOT NULL THEN
    NEW.agent_net_payout := calculate_agent_net_payout(
      NEW.final_commission_amount,
      NEW.brokerage_split_percentage,
      COALESCE(NEW.brokerage_fees, '[]'::jsonb)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_net_payout
  BEFORE INSERT OR UPDATE OF final_commission_amount, brokerage_split_percentage, brokerage_fees
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_net_payout();

-- Update RLS policies for commission workflow

-- Agents can view their own transactions including payout details
DROP POLICY IF EXISTS "Agents can view own transactions" ON public.transactions;
CREATE POLICY "Agents can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = agent_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Agents can update their transactions only if status is 'closed' and commission_status is 'pending_approval'
DROP POLICY IF EXISTS "Agents can update own transactions" ON public.transactions;
CREATE POLICY "Agents can update own transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = agent_id
    AND status = 'closed'
    AND commission_status = 'pending_approval'
  )
  WITH CHECK (
    auth.uid() = agent_id
    -- Agents can't modify commission approval fields
    AND commission_status = 'pending_approval'
  );

-- Admins can approve commission payouts
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
