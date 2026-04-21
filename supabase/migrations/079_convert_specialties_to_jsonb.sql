-- Convert specialties from TEXT[] to JSONB for better tag list functionality
-- This allows for more flexible querying and future extensibility

BEGIN;

-- Alter the column type to JSONB with conversion logic
-- This handles both NULL values and existing TEXT[] arrays
ALTER TABLE public.users
ALTER COLUMN specialties TYPE JSONB USING
  CASE
    WHEN specialties IS NULL OR array_length(specialties, 1) IS NULL THEN '[]'::jsonb
    ELSE to_jsonb(specialties)
  END;

-- Set default to empty JSONB array for new records
ALTER TABLE public.users
ALTER COLUMN specialties SET DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.users.specialties IS 'Agent specialties as JSONB array, e.g., ["Residential", "Commercial", "Luxury"]';

-- Create GIN index for efficient JSONB querying
CREATE INDEX IF NOT EXISTS idx_users_specialties_gin
  ON public.users USING gin (specialties);

COMMIT;
