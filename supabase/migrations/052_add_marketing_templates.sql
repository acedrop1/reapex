-- Add or update marketing templates with preview images and Canva links

-- Delete existing sample templates
DELETE FROM public.canva_templates WHERE template_id IN ('SAMPLE_TEMPLATE_ID_1', 'SAMPLE_TEMPLATE_ID_2', 'SAMPLE_TEMPLATE_ID_3');

-- Update category enum to include yard_sign
ALTER TABLE public.canva_templates DROP CONSTRAINT IF EXISTS canva_templates_category_check;
ALTER TABLE public.canva_templates ADD CONSTRAINT canva_templates_category_check
  CHECK (category IN ('business_card', 'property_flyer', 'yard_sign', 'social_media'));

-- Insert Professional Business Card template
INSERT INTO public.canva_templates (
  name,
  description,
  category,
  template_id,
  preview_image_url,
  canva_url,
  is_active,
  display_order
) VALUES (
  'Professional Business Card',
  'Reapex Real Estate professional business card design with your contact information',
  'business_card',
  'business-card-reapex',
  '/images/reapex-card.png',
  'https://www.canva.com/brand/brand-templates/EAG1I6KC93w',
  true,
  0
);

-- Insert Yard Sign template
INSERT INTO public.canva_templates (
  name,
  description,
  category,
  template_id,
  preview_image_url,
  canva_url,
  is_active,
  display_order
) VALUES (
  'Property Yard Sign',
  'Professional yard sign design for property marketing with Reapex branding',
  'yard_sign',
  'yard-sign-reapex',
  '/images/yard-sign.png',
  'https://www.canva.com/brand/brand-templates/EAG1OMZFIr8',
  true,
  0
);

-- Insert Property Flyer template
INSERT INTO public.canva_templates (
  name,
  description,
  category,
  template_id,
  preview_image_url,
  canva_url,
  is_active,
  display_order
) VALUES (
  'Just Listed Property Flyer',
  'Eye-catching property flyer with Just Listed design for your listings',
  'property_flyer',
  'property-flyer-reapex',
  '/images/flyer-image.png',
  'https://www.canva.com/brand/brand-templates/EAG1I6MAacU',
  true,
  0
);
