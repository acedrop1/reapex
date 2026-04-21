-- Add email_visible column to users table for privacy control
-- This allows agents to control whether their email is visible on public profile pages

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.users.email_visible IS 'Whether email is visible on public profile pages';
