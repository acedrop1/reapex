-- Add contract price and commission fields to transactions
-- Contract Price: required on new transactions (entered below listing price)
-- Commission: manual $ amount, or auto-calculated from a 0-10% percentage of contract price

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS contract_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) CHECK (commission_percentage IS NULL OR (commission_percentage >= 0 AND commission_percentage <= 10));

COMMENT ON COLUMN public.transactions.contract_price IS 'Agreed contract price for the transaction';
COMMENT ON COLUMN public.transactions.commission_amount IS 'Commission dollar amount (manual entry or calculated from commission_percentage of contract_price)';
COMMENT ON COLUMN public.transactions.commission_percentage IS 'Commission percentage of contract price (0-10), null when amount was entered manually';
