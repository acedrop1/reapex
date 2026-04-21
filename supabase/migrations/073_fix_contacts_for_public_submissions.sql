-- Fix contacts table to allow public submissions without agent assignment
-- This allows anonymous users to submit contact forms and sell requests

BEGIN;

-- Make agent_id nullable to allow public submissions
ALTER TABLE public.contacts
  ALTER COLUMN agent_id DROP NOT NULL;

-- Add name column for simpler public form submissions (optional alternative to first_name/last_name)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Add metadata column for storing additional form data (property details, etc.)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for faster queries on unassigned contacts
CREATE INDEX IF NOT EXISTS idx_contacts_unassigned
  ON public.contacts(created_at DESC)
  WHERE agent_id IS NULL;

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_contacts_source
  ON public.contacts(source);

COMMIT;

-- Note: Existing policies from migration 071 already allow anonymous INSERT
