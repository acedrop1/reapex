-- Migration: Update commission plan pricing — Zero Transaction Fee model
-- Launch: $0/mo, $22,500 cap (was $21,000)
-- Growth: $225/mo, $19,500 cap (was $175/mo, $18,000)
-- Pro: $550/mo, no cap (was $450/mo)
-- Transaction fees: DISABLED for standard Active Agents
-- Team Member 8% BSF (capped $1,500/txn): UNCHANGED

-- ============================================
-- STEP 1: Update plan cap function
-- ============================================
CREATE OR REPLACE FUNCTION get_plan_cap_amount(plan subscription_plan)
RETURNS DECIMAL(12, 2) AS $$
BEGIN
    CASE plan
        WHEN 'launch' THEN RETURN 22500.00;
        WHEN 'growth' THEN RETURN 19500.00;
        WHEN 'pro' THEN RETURN NULL; -- No cap for Pro plan
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 2: Update existing users' cap amounts
-- ============================================
UPDATE public.users
SET cap_amount = 22500
WHERE subscription_plan = 'launch' AND (cap_amount = 21000 OR cap_amount IS NULL);

UPDATE public.users
SET cap_amount = 19500
WHERE subscription_plan = 'growth' AND (cap_amount = 18000 OR cap_amount IS NULL);

-- ============================================
-- STEP 3: Add transaction_fee_enabled flag
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS transaction_fee_enabled BOOLEAN DEFAULT false;

-- Disable transaction fees for all standard active agents
UPDATE public.users
SET transaction_fee_enabled = false
WHERE role IN ('agent', 'broker');

-- Team members keep their 8% BSF — this is tracked via a separate flag
-- If you have a 'is_team_member' or similar column, those users retain their fee structure.
-- The application code should check transaction_fee_enabled before applying any per-transaction deduction.

-- ============================================
-- STEP 4: Add comment for documentation
-- ============================================
COMMENT ON COLUMN public.users.transaction_fee_enabled IS
'When false, no per-transaction fee is charged (Zero Transaction Fee model). When true, the legacy $495 or team member 8% BSF applies.';
