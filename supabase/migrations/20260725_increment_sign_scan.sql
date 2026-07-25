-- Yard sign scans are anonymous; RLS blocks anon UPDATE on yard_signs,
-- so scan_count silently never incremented. A SECURITY DEFINER function
-- lets the public sign page bump the counter without opening up the table.

CREATE OR REPLACE FUNCTION public.increment_sign_scan(sign_uuid UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.yard_signs
  SET scan_count = COALESCE(scan_count, 0) + 1
  WHERE id = sign_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.increment_sign_scan(UUID) TO anon, authenticated;
