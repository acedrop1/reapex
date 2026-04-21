-- Migrate data from old columns to new standard columns
UPDATE public.users 
SET years_experience = COALESCE(years_experience, years_of_experience),
    languages = COALESCE(languages, languages_spoken);

-- Drop index on old column if it exists
DROP INDEX IF EXISTS idx_users_years_of_experience;

-- Drop duplicate columns
ALTER TABLE public.users 
DROP COLUMN IF EXISTS years_of_experience,
DROP COLUMN IF EXISTS languages_spoken;

-- Create index on new column to match previous performance
CREATE INDEX IF NOT EXISTS idx_users_years_experience ON public.users (years_experience) WHERE years_experience IS NOT NULL;

-- Ensure comments are correct
COMMENT ON COLUMN public.users.years_experience IS 'Number of years of experience in real estate';
COMMENT ON COLUMN public.users.languages IS 'List of languages spoken by the agent';
