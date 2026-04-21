-- Add proper onboarding tracking fields and remove stripe_onboarding_completed
-- This enables tracking of onboarding wizard completion

-- Remove stripe onboarding field (no longer needed)
ALTER TABLE public.users
DROP COLUMN IF EXISTS stripe_onboarding_completed;

-- Add onboarding tracking fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add comments to document the columns
COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether user has completed the onboarding wizard';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Timestamp when onboarding wizard was completed';

-- Create index for querying users who have/haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
  ON public.users USING btree (onboarding_completed)
  WHERE onboarding_completed IS NOT NULL;
