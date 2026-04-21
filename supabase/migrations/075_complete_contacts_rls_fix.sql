-- COMPLETE FIX for public contact form submissions
-- This migration completely resets and fixes the contacts table RLS policies

BEGIN;

-- Step 1: Make agent_id nullable (required for public submissions)
ALTER TABLE public.contacts
  ALTER COLUMN agent_id DROP NOT NULL;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'contacts'
                 AND column_name = 'name') THEN
    ALTER TABLE public.contacts ADD COLUMN name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'contacts'
                 AND column_name = 'metadata') THEN
    ALTER TABLE public.contacts ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Step 3: DROP ALL existing policies on contacts table
DROP POLICY IF EXISTS "Agents can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can delete their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contacts;
DROP POLICY IF EXISTS "Public and agent contact submissions" ON public.contacts;

-- Step 4: Create NEW policies - starting fresh

-- INSERT policy: Allow both public (anon) and authenticated users to insert
-- Public submissions will have agent_id = NULL
-- Agent submissions will have agent_id = their user ID
CREATE POLICY "Allow public contact submissions"
ON public.contacts
FOR INSERT
TO public  -- Allow everyone including anonymous
WITH CHECK (true);  -- Allow all inserts - we'll handle validation in application

-- SELECT policy: Only let agents see contacts assigned to them
-- Admins can use service role key to see all
CREATE POLICY "Agents view own contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- UPDATE policy: Only agents can update their own contacts
CREATE POLICY "Agents update own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- DELETE policy: Only agents can delete their own contacts
CREATE POLICY "Agents delete own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_unassigned
  ON public.contacts(created_at DESC)
  WHERE agent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_source
  ON public.contacts(source);

CREATE INDEX IF NOT EXISTS idx_contacts_agent_status
  ON public.contacts(agent_id, status)
  WHERE agent_id IS NOT NULL;

COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'contacts';
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'contacts' AND column_name IN ('agent_id', 'name', 'metadata');
