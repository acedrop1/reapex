-- Allow anonymous users to submit contact forms
-- This enables public contact forms on agent pages and other public-facing forms

BEGIN;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contacts;

-- Create policy to allow anonymous INSERT
CREATE POLICY "Anyone can submit contact form"
ON contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

COMMIT;

-- Note: SELECT, UPDATE, DELETE remain restricted to agents/admins via existing policies
