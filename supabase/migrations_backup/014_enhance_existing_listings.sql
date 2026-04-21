-- Migration: Enhance existing listings with detailed information
-- Created: 2025-01-13

-- Update listings with detailed information, features, and cover images
-- Make some listings featured and add comprehensive property details

-- Listing 1: Three-bedroom family home (FEATURED)
UPDATE public.listings
SET
  bedrooms = 3,
  featured = true,
  cover_image = '/images/listings/reapex---hz-18157-1.jpg',
  description = 'Stunning three-bedroom family home in the heart of Fort Lee. This beautifully maintained property offers spacious living areas, modern finishes, and ample natural light throughout. Perfect for families looking for comfort and style in a prime location.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": true,
    "pool": false,
    "gym": true,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "balcony": true,
    "garageSpaces": 2,
    "storage": true,
    "security": true,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash", "Sewer"],
    "amenities": ["Fitness Center", "Concierge", "Elevator"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18157';

-- Listing 2: Stylish villa with city views (FEATURED)
UPDATE public.listings
SET
  bedrooms = 4,
  featured = true,
  cover_image = '/images/listings/reapex---hz-18155-1.jpg',
  description = 'Luxurious villa offering breathtaking city views and sophisticated urban living. This four-bedroom residence features high-end finishes, designer fixtures, and an open floor plan ideal for entertaining. Enjoy panoramic views from your private terrace.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": false,
    "pool": true,
    "gym": true,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "patio": true,
    "balcony": true,
    "garageSpaces": 3,
    "spa": false,
    "elevator": true,
    "fireplace": true,
    "storage": true,
    "security": true,
    "gatedCommunity": true,
    "utilities": ["Water", "Trash"],
    "amenities": ["Pool", "Spa", "Fitness Center", "Concierge", "Rooftop Terrace"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18155';

-- Listing 3: Studio with city view
UPDATE public.listings
SET
  bedrooms = 0,
  cover_image = '/images/listings/reapex---hz-18152-1.jpg',
  description = 'Charming studio apartment with spectacular city views. Perfect for young professionals or investors. Features modern appliances, efficient layout, and access to building amenities. Great location with easy access to transportation and dining.',
  features = '{
    "laundry": "Shared",
    "parking": "Garage",
    "lawn": false,
    "pool": false,
    "gym": true,
    "petFriendly": false,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": false,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "balcony": false,
    "garageSpaces": 1,
    "elevator": true,
    "storage": false,
    "security": true,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash", "Sewer"],
    "amenities": ["Fitness Center", "Elevator", "Laundry Room"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18152';

-- Listing 4: Spacious duplex (FEATURED)
UPDATE public.listings
SET
  bedrooms = 4,
  featured = true,
  cover_image = '/images/listings/reapex---hz-18151-1.jpg',
  description = 'Impressive spacious duplex offering luxury living across two levels. Four bedrooms, high ceilings, and premium finishes throughout. Features private garage, in-unit laundry, and access to exclusive building amenities. Perfect for executives and families.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": false,
    "pool": true,
    "gym": true,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "patio": false,
    "balcony": true,
    "garageSpaces": 3,
    "elevator": true,
    "fireplace": true,
    "storage": true,
    "security": true,
    "gatedCommunity": true,
    "utilities": ["Water", "Trash"],
    "amenities": ["Pool", "Fitness Center", "Concierge", "Game Room", "Business Center"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18151';

-- Listing 5: Stylish downtown apartment
UPDATE public.listings
SET
  bedrooms = 2,
  cover_image = '/images/listings/reapex---hz-18154-1.jpg',
  description = 'Contemporary two-bedroom apartment in vibrant downtown Fort Lee. Modern kitchen with stainless steel appliances, spacious bedrooms, and designer bathrooms. Walking distance to shops, restaurants, and entertainment. Ideal for urban professionals.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": false,
    "pool": false,
    "gym": true,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "balcony": true,
    "garageSpaces": 1,
    "elevator": true,
    "storage": true,
    "security": true,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash"],
    "amenities": ["Fitness Center", "Concierge", "Package Room"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18154';

-- Listing 6: Spacious apartment with parking
UPDATE public.listings
SET
  bedrooms = 2,
  cover_image = '/images/listings/reapex---hz-18150-1.jpg',
  description = 'Bright and spacious two-bedroom apartment featuring generous living space and convenient parking. Updated kitchen, comfortable bedrooms, and well-maintained building. Great value in a desirable Fort Lee neighborhood.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": false,
    "pool": false,
    "gym": false,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "balcony": false,
    "garageSpaces": 1,
    "elevator": true,
    "storage": true,
    "security": false,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash", "Sewer"],
    "amenities": ["Elevator", "Storage"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18150';

-- Listing 7: Studio with courtyard (FEATURED)
UPDATE public.listings
SET
  bedrooms = 0,
  featured = true,
  cover_image = '/images/listings/reapex---hz-18153-1.jpg',
  description = 'Cozy studio apartment overlooking a peaceful courtyard. Perfect starter home or investment property. Features efficient layout, updated appliances, and serene courtyard views. Excellent location with easy commute to NYC.',
  features = '{
    "laundry": "Shared",
    "parking": "Garage",
    "lawn": false,
    "pool": false,
    "gym": false,
    "petFriendly": false,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": false,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "balcony": false,
    "garageSpaces": 1,
    "elevator": true,
    "storage": false,
    "security": false,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash", "Sewer"],
    "amenities": ["Elevator", "Courtyard", "Laundry Room"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18153';

-- Listing 8: Suburban semi-detached house
UPDATE public.listings
SET
  bedrooms = 3,
  cover_image = '/images/listings/reapex---hz-18156-1.jpg',
  description = 'Beautiful three-bedroom semi-detached house in quiet suburban Fort Lee neighborhood. Spacious layout with modern updates, private garage, and outdoor space. Perfect for families seeking comfort and convenience.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": true,
    "pool": false,
    "gym": false,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "garden": true,
    "patio": true,
    "garageSpaces": 2,
    "storage": true,
    "security": false,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash"],
    "amenities": ["Private Garden", "Patio"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18156';

-- Listing 9: Three-bedroom with garden
UPDATE public.listings
SET
  bedrooms = 3,
  cover_image = '/images/listings/reapex---hz-18158-1.jpg',
  description = 'Exceptional three-bedroom residence with private garden. Features spacious interiors, updated kitchen and bathrooms, and beautiful outdoor space perfect for entertaining. Ideal family home in sought-after Fort Lee location.',
  features = '{
    "laundry": "In-unit",
    "parking": "Garage",
    "lawn": true,
    "pool": false,
    "gym": false,
    "petFriendly": true,
    "furnished": false,
    "airConditioning": true,
    "heating": "Central",
    "dishwasher": true,
    "refrigerator": true,
    "microwave": true,
    "oven": true,
    "washer": true,
    "dryer": true,
    "garden": true,
    "patio": true,
    "deck": true,
    "garageSpaces": 2,
    "storage": true,
    "security": false,
    "gatedCommunity": false,
    "utilities": ["Water", "Trash", "Sewer"],
    "amenities": ["Private Garden", "Patio", "Deck"]
  }'::jsonb
WHERE mls_number = 'Reapex - HZ-18158';

-- Verify updates
SELECT
  mls_number,
  bedrooms,
  featured,
  cover_image IS NOT NULL as has_cover,
  description IS NOT NULL as has_description,
  features != '{}'::jsonb as has_features
FROM public.listings
ORDER BY mls_number;
