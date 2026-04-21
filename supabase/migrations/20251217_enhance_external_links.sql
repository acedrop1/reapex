-- Add new columns to external_links table for enhanced display and functionality
ALTER TABLE external_links
ADD COLUMN IF NOT EXISTS icon_url text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS color_hex text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS display_order integer;
