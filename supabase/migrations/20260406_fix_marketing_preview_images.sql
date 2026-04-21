-- ============================================================================
-- Migration: Fix marketing template preview images
-- Created: 2026-04-06
-- Issue: Template images broken on /dashboard/marketing page
--
-- ROOT CAUSE: preview_image_url column either contains NULL values,
-- old Supabase storage paths from before bucket consolidation,
-- or paths that don't resolve to actual files.
--
-- FIX: Update to use public Next.js static paths (/images/...) that are
-- served directly by the Next.js app from the public/ directory.
-- ============================================================================

-- STEP 1: Diagnose - Run this first to see current state
-- Copy and run this SELECT to see what's in the table right now:

SELECT id, name, category, template_id, preview_image_url, is_active, display_order
FROM public.canva_templates
ORDER BY display_order ASC, created_at DESC;

-- ============================================================================
-- STEP 2: Fix known templates
-- These map to files that exist in public/images/ in the codebase:
--   - reapex-card.png  (113 KB)
--   - yard-sign.png    (148 KB)
--   - flyer-image.png  (366 KB)
-- ============================================================================

-- Fix by category (broader match than template_id)
UPDATE public.canva_templates
SET preview_image_url = '/images/reapex-card.png',
    updated_at = now()
WHERE category = 'business_card'
  AND (preview_image_url IS NULL 
       OR preview_image_url = '' 
       OR preview_image_url NOT LIKE '/images/%');

UPDATE public.canva_templates
SET preview_image_url = '/images/yard-sign.png',
    updated_at = now()
WHERE category = 'yard_sign'
  AND (preview_image_url IS NULL 
       OR preview_image_url = '' 
       OR preview_image_url NOT LIKE '/images/%');

UPDATE public.canva_templates
SET preview_image_url = '/images/flyer-image.png',
    updated_at = now()
WHERE category = 'property_flyer'
  AND (preview_image_url IS NULL 
       OR preview_image_url = '' 
       OR preview_image_url NOT LIKE '/images/%');

-- For social_media category (like "Just Listed Social Media"),
-- use flyer-image.png as a fallback since no dedicated social_media image exists yet
UPDATE public.canva_templates
SET preview_image_url = '/images/flyer-image.png',
    updated_at = now()
WHERE category = 'social_media'
  AND (preview_image_url IS NULL 
       OR preview_image_url = '' 
       OR preview_image_url NOT LIKE '/images/%');

-- ============================================================================
-- STEP 3: Catch-all for any remaining NULL/empty preview images
-- ============================================================================

UPDATE public.canva_templates
SET preview_image_url = '/images/reapex-card.png',
    updated_at = now()
WHERE is_active = true
  AND (preview_image_url IS NULL OR preview_image_url = '');

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================

SELECT id, name, category, preview_image_url, is_active
FROM public.canva_templates
WHERE is_active = true
ORDER BY display_order ASC;
