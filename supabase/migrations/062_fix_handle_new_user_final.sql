-- Migration: Fix handle_new_user trigger (final version)
-- Description: Ensures trigger properly creates user profile with all required fields
-- Created: 2025-12-01
-- This migration consolidates and fixes the handle_new_user trigger to be fully robust

-- Drop and recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile with all required fields
  -- Use ON CONFLICT in case the user already exists
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    account_status,
    cap_amount,
    current_cap_progress
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    'approved',  -- Auto-approve manually created users
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    account_status = COALESCE(EXCLUDED.account_status, users.account_status),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates or updates user profile when auth user is created. Auto-approves new users and handles conflicts gracefully.';
