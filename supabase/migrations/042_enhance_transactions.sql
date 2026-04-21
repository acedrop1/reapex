-- Enhance transactions table to support independent transactions
-- Add transaction_type and agency_type fields

-- Add new columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('sale', 'rental')),
ADD COLUMN IF NOT EXISTS agency_type TEXT CHECK (agency_type IN ('seller', 'buyer', 'dual', 'tenant', 'landlord')),
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;

-- Update existing transactions to have default values
UPDATE public.transactions
SET transaction_type = 'sale',
    agency_type = 'seller'
WHERE transaction_type IS NULL;

-- Make transaction_type and agency_type required for new records
ALTER TABLE public.transactions
ALTER COLUMN transaction_type SET NOT NULL,
ALTER COLUMN agency_type SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_agency ON public.transactions(agency_type);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON public.transactions(listing_id);

-- Add comments
COMMENT ON COLUMN public.transactions.transaction_type IS 'Type of transaction: sale or rental';
COMMENT ON COLUMN public.transactions.agency_type IS 'Agency representation: seller/buyer/dual for sales, tenant/landlord/dual for rentals';
COMMENT ON COLUMN public.transactions.listing_id IS 'Optional reference to a listing if transaction originated from one';
