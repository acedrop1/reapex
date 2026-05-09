-- Add icon_url column to brokerage_documents table
-- ManageResources component allows uploading icons for forms but the column was missing

ALTER TABLE public.brokerage_documents ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.brokerage_documents.icon_url IS 'Optional icon/thumbnail image URL for the document';
