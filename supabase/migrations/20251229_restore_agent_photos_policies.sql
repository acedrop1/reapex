-- Migration: Restore agent-photos storage bucket policies
-- Description: Restore the agent-photos bucket policies that were dropped by migration 061
-- Created: 2025-12-29

-- Ensure agent-photos bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-photos', 'agent-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing agent-photos policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own headshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view agent headshots" ON storage.objects;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own headshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own headshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'agent-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own headshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all agent photos (CRITICAL for displaying on public pages)
CREATE POLICY "Public can view agent headshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-photos');
