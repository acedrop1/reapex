-- Fix document type check constraint to be case-insensitive
-- Users might upload documents with different casing

-- Drop the existing constraint
ALTER TABLE public.transaction_documents
DROP CONSTRAINT IF EXISTS valid_document_type;

-- Add a new case-insensitive constraint
ALTER TABLE public.transaction_documents
ADD CONSTRAINT valid_document_type CHECK (
  UPPER(document_type) IN (
    'FULLY EXECUTED CONTRACT',
    'CIS',
    'DUAL AGENCY/INFORMED CONSENT',
    'SELLER DISCLOSURE',
    'LEAD-BASED PAINT DISCLOSURE',
    'PROOF OF DEPOSIT',
    'COMMISSION STATEMENT',
    'FINAL ALTA/CD',
    'OTHER'
  )
);

-- Update any existing records to use proper title case
UPDATE public.transaction_documents
SET document_type = INITCAP(document_type)
WHERE document_type != INITCAP(document_type);

-- Add comment
COMMENT ON CONSTRAINT valid_document_type ON public.transaction_documents IS 'Ensures document type is one of the valid transaction document types (case-insensitive)';
