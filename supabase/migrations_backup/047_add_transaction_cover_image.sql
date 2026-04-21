-- Add cover_image to transactions table
-- This allows transactions to store the main photo from listings

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.transactions.cover_image IS 'Main/cover image URL for the transaction property (auto-populated from listing cover_image)';

-- Create index for cover_image for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_cover_image
  ON public.transactions USING btree (cover_image)
  WHERE cover_image IS NOT NULL;
