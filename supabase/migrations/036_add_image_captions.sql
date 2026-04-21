-- Migration: Add image captions support to listings
-- Description: Add JSONB field to store gallery images with captions
-- Created: 2025-01-29

-- Add images_data column to store images with captions
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS images_data JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.listings.images_data IS 'Gallery images with captions - array of {url: string, caption: string}';

-- Migrate existing images to images_data (if images array exists)
UPDATE public.listings
SET images_data = (
    SELECT jsonb_agg(jsonb_build_object('url', img, 'caption', ''))
    FROM unnest(images) AS img
)
WHERE images IS NOT NULL AND array_length(images, 1) > 0;
