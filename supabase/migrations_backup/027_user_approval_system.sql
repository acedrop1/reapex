-- Migration: User Approval System
-- Description: Adds account status management for user approval workflow
-- Created: 2025-01-29

-- Create account_status enum type
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to 'approved' status for backward compatibility
UPDATE public.users
SET account_status = 'approved'
WHERE account_status IS NULL;

-- Create index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

-- Create index for approved_by lookups
CREATE INDEX IF NOT EXISTS idx_users_approved_by ON public.users(approved_by);

-- Add comment to explain the columns
COMMENT ON COLUMN public.users.account_status IS 'User account status: pending (awaiting approval), approved (active), rejected (denied access), suspended (temporarily blocked)';
COMMENT ON COLUMN public.users.approved_by IS 'ID of the admin/broker who approved this user';
COMMENT ON COLUMN public.users.approved_at IS 'Timestamp when the user was approved';
