-- Add 'yard_sign' category to canva_templates table
-- This allows templates for yard sign designs

-- Drop the existing constraint
ALTER TABLE canva_templates
DROP CONSTRAINT IF EXISTS canva_templates_category_check;

-- Add new constraint with yard_sign included
ALTER TABLE canva_templates
ADD CONSTRAINT canva_templates_category_check
CHECK (category IN ('business_card', 'property_flyer', 'yard_sign', 'social_media'));

-- Add comment to document the change
COMMENT ON COLUMN canva_templates.category IS 'Template category: business_card, property_flyer, yard_sign, or social_media';
