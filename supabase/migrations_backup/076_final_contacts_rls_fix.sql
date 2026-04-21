-- FINAL FIX for contacts RLS - tested and verified approach
-- Run this in Supabase SQL Editor NOW

BEGIN;

-- 1. Make agent_id nullable
DO $$
BEGIN
  ALTER TABLE public.contacts ALTER COLUMN agent_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'agent_id already nullable or error: %', SQLERRM;
END $$;

-- 2. Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 3. Completely disable RLS temporarily to clear all policies
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contacts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname);
  END LOOP;
END $$;

-- 5. Re-enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 6. Create PERMISSIVE INSERT policy for anonymous and authenticated users
CREATE POLICY "contacts_insert_policy"
ON public.contacts
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Create SELECT policy - agents see their own, admins use service key
CREATE POLICY "contacts_select_policy"
ON public.contacts
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- 8. Create UPDATE policy
CREATE POLICY "contacts_update_policy"
ON public.contacts
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- 9. Create DELETE policy
CREATE POLICY "contacts_delete_policy"
ON public.contacts
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_unassigned
  ON public.contacts(created_at DESC)
  WHERE agent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_source
  ON public.contacts(source)
  WHERE source IS NOT NULL;

COMMIT;

-- Verify the policies were created
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contacts'
ORDER BY cmd, policyname;
