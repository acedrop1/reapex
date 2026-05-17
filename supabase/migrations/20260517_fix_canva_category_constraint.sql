-- Fix canva_templates category constraint to include all UI options
-- The UI offers 'Photography' and 'Other' but the DB constraint only allows 4 categories
-- This was causing silent update failures when editing templates with those categories

ALTER TABLE public.canva_templates DROP CONSTRAINT IF EXISTS canva_templates_category_check;

ALTER TABLE public.canva_templates ADD CONSTRAINT canva_templates_category_check
  CHECK (category IN ('business_card', 'property_flyer', 'yard_sign', 'social_media', 'photography', 'other'));

COMMENT ON COLUMN canva_templates.category IS 'Template category: business_card, property_flyer, yard_sign, social_media, photography, or other';
