-- Add profile settings fields for Stripe, phone visibility, and email preferences
-- This enables payment integration, privacy controls, and notification preferences

-- Add Stripe payment fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add phone visibility control
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT TRUE;

-- Add email notification preferences (JSONB for flexibility)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "new_leads": true,
  "transaction_updates": true,
  "commission_notifications": true,
  "marketing_updates": false,
  "system_announcements": true
}'::jsonb;

-- Add comments to document the columns
COMMENT ON COLUMN public.users.stripe_account_id IS 'Stripe Connect account ID for payment processing';
COMMENT ON COLUMN public.users.stripe_connected IS 'Whether user has connected their Stripe account';
COMMENT ON COLUMN public.users.stripe_onboarding_completed IS 'Whether Stripe onboarding process is complete';
COMMENT ON COLUMN public.users.phone_visible IS 'Whether phone number is visible on public profile pages';
COMMENT ON COLUMN public.users.email_preferences IS 'Email notification preferences (new_leads, transaction_updates, commission_notifications, marketing_updates, system_announcements)';

-- Create index for Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id
  ON public.users USING btree (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
