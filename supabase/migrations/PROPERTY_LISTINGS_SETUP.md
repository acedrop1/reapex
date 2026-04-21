# Property Listings Enhancement & Gallery Setup

## Overview
This guide covers the setup for enhanced property listings with detailed information and image gallery management.

## Migrations

### 014_enhance_existing_listings.sql
Updates existing listings with:
- **Featured Flags**: 4 properties marked as featured (HZ-18157, HZ-18155, HZ-18151, HZ-18153)
- **Bedroom Counts**: Added missing bedroom data to all properties
- **Cover Images**: Set cover images using the first image from each listing's images array
- **Detailed Descriptions**: Added compelling property descriptions for all listings
- **JSONB Features**: Comprehensive feature sets including:
  - Laundry (In-unit, Shared, None)
  - Parking (Garage, Driveway, Street, etc.)
  - Amenities (Pool, Gym, Security, etc.)
  - Utilities included
  - Appliances
  - Building features

### 015_setup_property_listings_storage.sql
Sets up Supabase Storage for property images:
- **Bucket**: `property-listings` (public)
- **File Size Limit**: 10MB per file
- **Allowed Types**: JPEG, PNG, WebP, GIF
- **Policies**:
  - Authenticated users can upload/update/delete
  - Public can view all images

## Running the Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration content
4. Click "Run"

### Option 2: Supabase CLI
```bash
# Run migrations in order
supabase db push

# Or run individually
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/014_enhance_existing_listings.sql
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/015_setup_property_listings_storage.sql
```

## PropertyImageGallery Component

### Features
- **Multi-file Upload**: Upload multiple images at once
- **Drag & Drop Support**: Easy image management
- **Cover Photo Selection**: Click star icon to set cover photo
- **Image Deletion**: Remove unwanted images
- **Real-time Updates**: Instant feedback on upload/delete operations
- **Automatic Storage**: Images stored in Supabase Storage bucket
- **Public URLs**: Automatic generation of public image URLs

### Usage in Listing Creator/Editor

```tsx
import { PropertyImageGallery } from '@/components/listings/PropertyImageGallery';

// In your listing form component
const [images, setImages] = useState<string[]>([]);
const [coverImage, setCoverImage] = useState<string | null>(null);

// In your form
<PropertyImageGallery
  images={images}
  coverImage={coverImage}
  listingId={listingId} // Use existing ID or generate temp ID for new listings
  onImagesChange={setImages}
  onCoverImageChange={setCoverImage}
/>
```

### Integration with Listing Form

```tsx
// When saving the listing
const handleSaveListing = async () => {
  const listingData = {
    // ... other fields
    images: images,
    cover_image: coverImage,
  };

  const { data, error } = await supabase
    .from('listings')
    .upsert(listingData);
};
```

## Storage Bucket Setup

### Manual Setup (if migration doesn't auto-create)
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `property-listings`
4. Set to **Public**
5. Click "Create bucket"

### Bucket Configuration
- **Public Access**: Enabled (for public property viewing)
- **File Size Limit**: 10MB per file
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/gif`

## Featured Listings Summary

| MLS Number | Address | Bedrooms | Price | Features Highlight |
|------------|---------|----------|-------|-------------------|
| HZ-18157 | Three-bedroom family home | 3 | $29,000,000 | In-unit laundry, Garage, Gym, Pet-friendly |
| HZ-18155 | Stylish villa with city views | 4 | $32,000,000 | Pool, Spa, Gated community, Rooftop terrace |
| HZ-18151 | Spacious duplex | 4 | $32,000,000 | Pool, Gym, Fireplace, Business center |
| HZ-18153 | Studio with courtyard | 0 (Studio) | $120,000 | Courtyard views, Elevator, Great investment |

## Feature Schema Examples

### Luxury Property Features
```json
{
  "laundry": "In-unit",
  "parking": "Garage",
  "pool": true,
  "gym": true,
  "spa": true,
  "petFriendly": true,
  "airConditioning": true,
  "heating": "Central",
  "fireplace": true,
  "balcony": true,
  "garageSpaces": 3,
  "elevator": true,
  "security": true,
  "gatedCommunity": true,
  "utilities": ["Water", "Trash"],
  "amenities": ["Pool", "Spa", "Fitness Center", "Concierge", "Rooftop Terrace"]
}
```

### Standard Apartment Features
```json
{
  "laundry": "Shared",
  "parking": "Garage",
  "gym": true,
  "petFriendly": false,
  "airConditioning": true,
  "heating": "Central",
  "elevator": true,
  "garageSpaces": 1,
  "security": true,
  "utilities": ["Water", "Trash", "Sewer"],
  "amenities": ["Fitness Center", "Elevator", "Laundry Room"]
}
```

## Querying Enhanced Features

### Find listings with specific amenities
```sql
-- Properties with pools
SELECT * FROM listings
WHERE features->>'pool' = 'true'
AND status = 'active';

-- Properties with in-unit laundry
SELECT * FROM listings
WHERE features->>'laundry' = 'In-unit'
AND status = 'active';

-- Pet-friendly properties
SELECT * FROM listings
WHERE features->>'petFriendly' = 'true'
AND status = 'active';

-- Properties with specific utilities included
SELECT * FROM listings
WHERE features->'utilities' ? 'Water'
AND status = 'active';

-- Properties with fitness center
SELECT * FROM listings
WHERE features->'amenities' @> '["Fitness Center"]'::jsonb
AND status = 'active';
```

## Next Steps

1. **Run Migrations**: Execute both SQL migrations in order
2. **Verify Storage**: Check that property-listings bucket exists
3. **Test Upload**: Try uploading an image through the gallery component
4. **Update Forms**: Integrate PropertyImageGallery into your listing creator
5. **Test Features**: Verify feature filtering works correctly

## Troubleshooting

### Storage Upload Fails
- Verify bucket exists and is public
- Check storage policies are correctly set
- Ensure file size is under 10MB
- Verify file type is allowed (JPEG, PNG, WebP, GIF)

### Images Not Displaying
- Check public URL generation
- Verify bucket is set to public
- Check browser console for CORS errors

### Feature Queries Not Working
- Ensure features column has GIN index
- Verify JSONB syntax in queries
- Check that features follow the schema structure

## Support
For issues or questions, refer to:
- Supabase Storage docs: https://supabase.com/docs/guides/storage
- JSONB queries: https://www.postgresql.org/docs/current/datatype-json.html
