-- Migration: Update transaction volume to use ranges instead of integer
-- Created: 2025-01-24

-- Create transaction volume range enum
DO $$ BEGIN
  CREATE TYPE transaction_volume_range AS ENUM ('0_5', '6_12', '13_plus');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alter the agent_applications table to use the new enum
-- First, add a new column with the enum type
ALTER TABLE public.agent_applications
  ADD COLUMN IF NOT EXISTS transactions_12_months_range transaction_volume_range;

-- Migrate existing integer data to the new range format
UPDATE public.agent_applications
SET transactions_12_months_range = CASE
  WHEN transactions_12_months BETWEEN 0 AND 5 THEN '0_5'::transaction_volume_range
  WHEN transactions_12_months BETWEEN 6 AND 12 THEN '6_12'::transaction_volume_range
  WHEN transactions_12_months >= 13 THEN '13_plus'::transaction_volume_range
  ELSE '0_5'::transaction_volume_range
END
WHERE transactions_12_months_range IS NULL;

-- Drop the old integer column
ALTER TABLE public.agent_applications
  DROP COLUMN IF EXISTS transactions_12_months;

-- Rename the new column to the original name
ALTER TABLE public.agent_applications
  RENAME COLUMN transactions_12_months_range TO transactions_12_months;

-- Make the column NOT NULL
ALTER TABLE public.agent_applications
  ALTER COLUMN transactions_12_months SET NOT NULL;

-- Add comment to document the new column
COMMENT ON COLUMN public.agent_applications.transactions_12_months IS 'Transaction volume range in last 12 months: 0-5, 6-12, or 13+';
