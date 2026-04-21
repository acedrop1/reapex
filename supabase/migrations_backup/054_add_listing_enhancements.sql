-- Add virtual tour and floor plan fields to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining floor_plans structure
COMMENT ON COLUMN public.listings.floor_plans IS 'Array of floor plan objects with structure: [{ title: string, image_url: string, description: string }]';

-- Example floor_plans data structure:
-- [
--   {
--     "title": "First Floor",
--     "image_url": "https://...",
--     "description": "Main living area with kitchen, dining room, and living room"
--   },
--   {
--     "title": "Second Floor",
--     "image_url": "https://...",
--     "description": "3 bedrooms and 2 bathrooms"
--   }
-- ]
