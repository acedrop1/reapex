-- Migration: Fix marketing template image paths
-- Description: Ensures all marketing templates have correct, accessible preview image paths
-- Created: 2026-02-18
-- Issue: Template images not displaying - verify paths point to existing public assets

-- Update existing templates to ensure they have correct preview_image_url paths
-- These files exist in public/images/ and should be accessible at /images/{filename}

UPDATE public.canva_templates
SET preview_image_url = '/images/reapex-card.png',
    updated_at = now()
WHERE template_id = 'business-card-reapex'
  AND (preview_image_url IS NULL OR preview_image_url != '/images/reapex-card.png');

UPDATE public.canva_templates
SET preview_image_url = '/images/yard-sign.png',
    updated_at = now()
WHERE template_id = 'yard-sign-reapex'
  AND (preview_image_url IS NULL OR preview_image_url != '/images/yard-sign.png');

UPDATE public.canva_templates
SET preview_image_url = '/images/flyer-image.png',
    updated_at = now()
WHERE template_id = 'property-flyer-reapex'
  AND (preview_image_url IS NULL OR preview_image_url != '/images/flyer-image.png');

-- Verify all active templates have preview images
-- If any templates are missing preview_image_url, this will help identify them
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.canva_templates
  WHERE is_active = true
    AND (preview_image_url IS NULL OR preview_image_url = '');

  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % active templates are missing preview images', missing_count;
  ELSE
    RAISE NOTICE 'All active templates have preview images configured';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN canva_templates.preview_image_url IS 'URL or path to template preview image. Can be public path (/images/...) or Supabase storage URL';
