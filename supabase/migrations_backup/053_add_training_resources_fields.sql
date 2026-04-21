-- Add missing fields to training_resources table
ALTER TABLE public.training_resources
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS resource_type TEXT CHECK (resource_type IN ('video', 'pdf', 'document', 'slides', 'spreadsheet')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Drop url column if it exists (replaced by video_url and document_url)
ALTER TABLE public.training_resources
DROP COLUMN IF EXISTS url;

-- Update existing rows to set default resource_type
UPDATE public.training_resources
SET resource_type = 'document'
WHERE resource_type IS NULL;

-- Make resource_type NOT NULL after setting defaults
ALTER TABLE public.training_resources
ALTER COLUMN resource_type SET NOT NULL;

-- Add comment
COMMENT ON TABLE public.training_resources IS 'Training resources including videos, PDFs, documents, presentations, and spreadsheets with thumbnails and previews';
