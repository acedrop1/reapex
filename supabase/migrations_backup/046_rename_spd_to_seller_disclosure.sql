-- Rename SPD to Seller Disclosure in transaction documents
-- This updates the constraint to replace the abbreviation with the full term

-- Drop the old constraint
ALTER TABLE public.transaction_documents
DROP CONSTRAINT IF EXISTS valid_document_type;

-- Add the updated constraint with "Seller Disclosure" instead of "SPD"
ALTER TABLE public.transaction_documents
ADD CONSTRAINT valid_document_type CHECK (
  document_type IN (
    'Fully Executed Contract',
    'CIS',
    'Dual Agency/Informed Consent',
    'Seller Disclosure',
    'Lead-Based Paint Disclosure',
    'Proof of Deposit',
    'Commission Statement',
    'Final ALTA/CD',
    'Other'
  )
);

-- Update existing records that have 'SPD' to 'Seller Disclosure'
UPDATE public.transaction_documents
SET document_type = 'Seller Disclosure'
WHERE document_type = 'SPD';

-- Add comment
COMMENT ON CONSTRAINT valid_document_type ON public.transaction_documents IS 'Ensures document type is one of the valid transaction document types';
