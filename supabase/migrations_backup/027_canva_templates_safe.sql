-- Create canva_templates table for managing Canva template references
CREATE TABLE IF NOT EXISTS canva_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('business_card', 'property_flyer', 'social_media')),
  template_id TEXT NOT NULL,  -- Canva template ID (e.g., DAFxxxxx)
  preview_image_url TEXT,
  canva_url TEXT NOT NULL,  -- Full Canva template URL
  field_mappings JSONB DEFAULT '{}',  -- For future auto-population: {"agent_name": "{{Agent Name}}", "email": "{{Email}}"}
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on category for faster filtering (drop if exists first)
DROP INDEX IF EXISTS idx_canva_templates_category;
CREATE INDEX idx_canva_templates_category ON canva_templates(category);

-- Create index on is_active for filtering active templates (drop if exists first)
DROP INDEX IF EXISTS idx_canva_templates_active;
CREATE INDEX idx_canva_templates_active ON canva_templates(is_active);

-- Add RLS policies
ALTER TABLE canva_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active templates" ON canva_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON canva_templates;

-- All authenticated users can view active templates
CREATE POLICY "Anyone can view active templates"
  ON canva_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can insert/update/delete templates
CREATE POLICY "Admins can manage templates"
  ON canva_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert sample templates only if table is empty
INSERT INTO canva_templates (name, description, category, template_id, canva_url, preview_image_url, display_order)
SELECT * FROM (VALUES
  (
    'Professional Business Card',
    'Clean and modern business card design for real estate agents',
    'business_card',
    'SAMPLE_TEMPLATE_ID_1',
    'https://www.canva.com/design/SAMPLE_TEMPLATE_ID_1/edit',
    '/images/templates/business-card-preview.png',
    1
  ),
  (
    'Luxury Listing Flyer',
    'High-end property flyer with elegant design',
    'property_flyer',
    'SAMPLE_TEMPLATE_ID_2',
    'https://www.canva.com/design/SAMPLE_TEMPLATE_ID_2/edit',
    '/images/templates/luxury-flyer-preview.png',
    1
  ),
  (
    'Instagram Post - Just Listed',
    'Eye-catching social media graphic for new listings',
    'social_media',
    'SAMPLE_TEMPLATE_ID_3',
    'https://www.canva.com/design/SAMPLE_TEMPLATE_ID_3/edit',
    '/images/templates/instagram-listed-preview.png',
    1
  )
) AS new_templates
WHERE NOT EXISTS (SELECT 1 FROM canva_templates LIMIT 1);

-- Add comment
COMMENT ON TABLE canva_templates IS 'Stores Canva template references for marketing materials';
