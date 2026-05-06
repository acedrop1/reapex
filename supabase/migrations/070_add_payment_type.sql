-- Add payment_type column to transactions table for commission payouts
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT NULL;

-- Add a check constraint for valid payment types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_payment_type_check'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_payment_type_check
    CHECK (payment_type IS NULL OR payment_type IN ('check', 'direct_deposit'));
  END IF;
END $$;

COMMENT ON COLUMN public.transactions.payment_type IS 'Payment method: check or direct_deposit';
