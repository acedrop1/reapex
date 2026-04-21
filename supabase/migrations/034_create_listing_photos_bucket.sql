-- Migration: Create listing-photos storage bucket
-- Description: Storage bucket for property listing images (cover and gallery)
-- Created: 2025-01-29

-- Create listing-photos bucket (public, 10MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any listing photos" ON storage.objects;

-- Policy: Public can view listing photos
CREATE POLICY "Public can view listing photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-photos');

-- Policy: Authenticated agents can upload listing photos
CREATE POLICY "Agents can upload listing photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listing-photos'
    );

-- Policy: Agents can delete their own listing photos
CREATE POLICY "Agents can delete own listing photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-photos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Admins can delete any listing photos
CREATE POLICY "Admins can delete any listing photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-photos' AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
