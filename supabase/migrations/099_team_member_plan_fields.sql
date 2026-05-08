-- Add Team Member plan fields to users table
-- Team members pay 8% brokerage service fee per transaction, capped at $1,500 per tx

ALTER TABLE users ADD COLUMN IF NOT EXISTS brokerage_service_fee_pct numeric DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS brokerage_service_fee_cap numeric DEFAULT NULL;

-- Add 'team_member' to any plan-related enums or checks if they exist
-- (subscription_plan is a text field, so no enum change needed)

COMMENT ON COLUMN users.brokerage_service_fee_pct IS 'Brokerage service fee percentage for team member plans (e.g. 8)';
COMMENT ON COLUMN users.brokerage_service_fee_cap IS 'Per-transaction cap on brokerage service fee in dollars (e.g. 1500)';
