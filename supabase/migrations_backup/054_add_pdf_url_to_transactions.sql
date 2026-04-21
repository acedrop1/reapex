-- Add pdf_url column to transactions table to store generated payout PDFs
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN public.transactions.pdf_url IS 'URL to the generated commission payout PDF statement';
