-- Migration: Allow admin_agent to manage all agent headshots
-- Description: Enable admin_agent role to upload/update/delete headshots for any agent
-- Created: 2025-12-29

-- Drop existing agent-photos policies
DROP POLICY IF EXISTS "Users can upload their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view agent headshots" ON storage.objects;

-- Policy: Users can upload their own headshots OR admins/admin_agents can upload any headshot
CREATE POLICY "Users and admins can upload headshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-photos' AND (
    -- Users can upload to their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins and admin_agents can upload to any folder
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  )
);

-- Policy: Users can update their own headshots OR admins/admin_agents can update any headshot
CREATE POLICY "Users and admins can update headshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-photos' AND (
    -- Users can update their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins and admin_agents can update any folder
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  )
)
WITH CHECK (
  bucket_id = 'agent-photos' AND (
    -- Users can update their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins and admin_agents can update any folder
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  )
);

-- Policy: Users can delete their own headshots OR admins/admin_agents can delete any headshot
CREATE POLICY "Users and admins can delete headshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-photos' AND (
    -- Users can delete from their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins and admin_agents can delete from any folder
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'admin_agent')
    )
  )
);

-- Policy: Public can view all agent headshots
CREATE POLICY "Public can view agent headshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-photos');
