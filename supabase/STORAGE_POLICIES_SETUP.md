# Property Listings Storage Policies Setup

## Setup via Supabase Dashboard (Recommended)

Since the `property-listings` bucket already exists, follow these steps to set up the policies:

### Step 1: Navigate to Storage
1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Select the **property-listings** bucket

### Step 2: Create Policies

Click on **Policies** tab, then create the following 4 policies:

---

#### Policy 1: Public Read Access
**Name**: `Public can view property images`
**Allowed operation**: SELECT
**Policy definition**:
```sql
bucket_id = 'property-listings'
```
**Target roles**: `public`

---

#### Policy 2: Authenticated Upload
**Name**: `Authenticated users can upload property images`
**Allowed operation**: INSERT
**Policy definition**:
```sql
bucket_id = 'property-listings' AND auth.role() = 'authenticated'
```
**Target roles**: `authenticated`

---

#### Policy 3: Authenticated Update
**Name**: `Users can update property images`
**Allowed operation**: UPDATE
**Policy definition**:
```sql
bucket_id = 'property-listings'
```
**Target roles**: `authenticated`

---

#### Policy 4: Authenticated Delete
**Name**: `Authenticated users can delete property images`
**Allowed operation**: DELETE
**Policy definition**:
```sql
bucket_id = 'property-listings' AND auth.role() = 'authenticated'
```
**Target roles**: `authenticated`

---

## Quick Setup Guide

### For Each Policy:
1. Click **"New Policy"** in the Policies tab
2. Choose **"For full customization"**
3. Enter the policy name
4. Select the allowed operation (SELECT, INSERT, UPDATE, or DELETE)
5. Enter the policy definition SQL
6. Select target roles
7. Click **"Review"** then **"Save policy"**

## Verify Setup

After creating all policies, you should have:
- ✅ 1 SELECT policy (public read)
- ✅ 1 INSERT policy (authenticated upload)
- ✅ 1 UPDATE policy (authenticated update)
- ✅ 1 DELETE policy (authenticated delete)

## Test the Setup

### Test Upload (from your app)
```tsx
const { data, error } = await supabase.storage
  .from('property-listings')
  .upload('test/test.jpg', file);

if (!error) console.log('Upload successful!');
```

### Test Public Access
```tsx
const { data } = supabase.storage
  .from('property-listings')
  .getPublicUrl('test/test.jpg');

console.log('Public URL:', data.publicUrl);
```

## Alternative: SQL via Service Role (Advanced)

If you have access to the service role key, you can run this SQL:

```sql
-- Connect with service_role permissions
-- Run in Supabase SQL Editor with service role

BEGIN;

-- Public read access
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-listings');

-- Authenticated upload
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-listings' AND auth.role() = 'authenticated');

-- Authenticated update
CREATE POLICY "Users can update property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-listings')
WITH CHECK (bucket_id = 'property-listings');

-- Authenticated delete
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-listings' AND auth.role() = 'authenticated');

COMMIT;
```

## Troubleshooting

### "Must be owner of relation objects" Error
- This means you don't have permission to modify storage policies via SQL
- Use the Dashboard UI method instead (recommended)
- Or connect with service_role credentials

### Policies Not Working
- Check that all 4 policies are created and enabled
- Verify the bucket_id matches exactly: `property-listings`
- Ensure users are authenticated when uploading
- Check browser console for detailed error messages

### Upload Fails
- Verify file size is under bucket limit (10MB)
- Check file type is allowed (JPEG, PNG, WebP, GIF)
- Ensure user is authenticated
- Check storage quota hasn't been exceeded

## Next Steps

1. ✅ Create all 4 policies via Dashboard
2. ✅ Run migration 014_enhance_existing_listings.sql
3. ✅ Test image upload with PropertyImageGallery component
4. ✅ Verify public image URLs work correctly
