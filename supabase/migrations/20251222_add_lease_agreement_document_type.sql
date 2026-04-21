-- Add Fully Executed Lease Agreement to valid transaction document types
-- Date: 2025-12-22
-- Description: Adds 'Fully Executed Lease Agreement' for rental transactions
-- Keeps 'Proof of Deposit' for backward compatibility with historical transactions

-- Drop the existing constraint
ALTER TABLE public.transaction_documents
DROP CONSTRAINT IF EXISTS valid_document_type;

-- Add the updated constraint with both sales and rental document types
ALTER TABLE public.transaction_documents
ADD CONSTRAINT valid_document_type CHECK (
  document_type IN (
    'Fully Executed Contract',
    'Fully Executed Lease Agreement',
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

-- Update comment to reflect both sales and rental document types
COMMENT ON CONSTRAINT valid_document_type ON public.transaction_documents IS
  'Ensures document type is one of the valid transaction document types for both sales and rental transactions';
