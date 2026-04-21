-- Migration: Create listing-images storage bucket
-- Description: Storage bucket for property listing images used by CreateListingModal and EditListingModal
-- Created: 2026-02-18
-- Issue: Components use 'listing-images' bucket which doesn't exist, causing upload failures

-- Create listing-images bucket (public, 10MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update listing images" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any listing images" ON storage.objects;

-- Policy: Public can view listing images
CREATE POLICY "Public can view listing images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-images');

-- Policy: Authenticated agents can upload listing images
CREATE POLICY "Agents can upload listing images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listing-images'
    );

-- Policy: Authenticated agents can update their own listing images
CREATE POLICY "Agents can update listing images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'listing-images' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Agents can delete their own listing images (folder structure: {user_id}/...)
CREATE POLICY "Agents can delete own listing images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-images' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Admins can delete any listing images
CREATE POLICY "Admins can delete any listing images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-images' AND
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
