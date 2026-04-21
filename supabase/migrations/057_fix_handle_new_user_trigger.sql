-- Migration: Fix handle_new_user trigger to set account_status
-- Description: Ensures account_status is explicitly set to 'approved' when creating user profile
-- Created: 2025-12-01

-- Recreate handle_new_user function with account_status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    account_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    'approved'  -- Explicitly set to approved
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile when auth user is created. Auto-approves all new users.';
