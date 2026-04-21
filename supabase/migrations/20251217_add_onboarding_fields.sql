-- Add onboarding fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS languages TEXT[];

COMMENT ON COLUMN public.users.years_experience IS 'Number of years of experience in real estate';
COMMENT ON COLUMN public.users.languages IS 'List of languages spoken by the agent';
