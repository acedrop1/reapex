-- Create agent-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-photos', 'agent-photos', true)
ON CONFLICT (id) DO NOTHING;

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

-- Allow public read access to all agent photos
CREATE POLICY "Public can view agent headshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-photos');
