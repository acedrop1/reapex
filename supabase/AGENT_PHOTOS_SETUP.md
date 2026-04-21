# Agent Photos Storage Setup

This document explains how to set up the agent-photos storage bucket in Supabase.

## Overview

The `agent-photos` bucket stores agent headshot images uploaded through the profile page. It uses a folder-based structure where each user's photos are stored in a folder named after their user ID.

## Setup Instructions

### Option 1: Run Migration (Recommended)

Run the migration file to automatically create the bucket and policies:

```bash
# Apply the migration
psql $DATABASE_URL -f supabase/migrations/015_agent_photos_storage.sql
```

Or through Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/015_agent_photos_storage.sql`
3. Execute the SQL

### Option 2: Manual Setup via Supabase Dashboard

1. **Create Bucket**
   - Navigate to Storage in Supabase Dashboard
   - Click "New Bucket"
   - Name: `agent-photos`
   - Public bucket: ✅ Yes
   - File size limit: 5MB (recommended)
   - Allowed MIME types: `image/*`

2. **Create Policies**

   Go to Storage → Policies and create the following:

   **Upload Policy (INSERT)**
   ```sql
   CREATE POLICY "Users can upload their own headshots"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'agent-photos' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Update Policy**
   ```sql
   CREATE POLICY "Users can update their own headshots"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'agent-photos' AND
     (storage.foldername(name))[1] = auth.uid()::text
   )
   WITH CHECK (
     bucket_id = 'agent-photos' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Delete Policy**
   ```sql
   CREATE POLICY "Users can delete their own headshots"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'agent-photos' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Public Read Policy (SELECT)**
   ```sql
   CREATE POLICY "Public can view agent headshots"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'agent-photos');
   ```

## Folder Structure

Files are organized by user ID:
```
agent-photos/
├── {user-id-1}/
│   ├── 1234567890.jpg
│   └── 1234567891.png
├── {user-id-2}/
│   └── 1234567892.webp
```

## Security

- ✅ Users can only upload/update/delete their own photos
- ✅ All photos are publicly readable (for profile display)
- ✅ 5MB file size limit enforced client-side
- ✅ Only image files accepted (`image/*`)

## Usage

The `HeadshotUploader` component handles:
- Drag and drop file upload
- File validation (type and size)
- Upload to correct user folder
- Public URL generation
- Preview display

## Testing

1. Log in to the portal
2. Navigate to Profile → Profile Settings
3. Click "Edit"
4. Drag and drop an image or click the upload area
5. Verify the image uploads and displays correctly
6. Check that the URL is saved to the user's `headshot_url` field

## Troubleshooting

**Upload fails with "not allowed"**
- Check that the storage policies are created correctly
- Verify the user is authenticated
- Check browser console for specific error messages

**Images don't display**
- Verify bucket is set to public
- Check the public URL format matches: `https://{project}.supabase.co/storage/v1/object/public/agent-photos/{user-id}/{filename}`

**Large files fail**
- Confirm file is under 5MB
- Check browser network tab for 413 errors
