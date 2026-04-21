# Training Resources Storage Setup

This document explains how to set up the training-resources storage bucket in Supabase.

## Overview

The `training-resources` bucket stores training documents (PDFs, Word docs, Excel files, PowerPoint presentations, etc.) uploaded through the Training & Resources page. Only admins can upload, update, or delete resources, but all authenticated users can view and download them.

## Setup Instructions

### Option 1: Run Migration (Recommended)

Run the migration file to automatically create the bucket and policies:

```bash
# Apply the migration
psql $DATABASE_URL -f supabase/migrations/016_training_resources_storage.sql
```

Or through Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/016_training_resources_storage.sql`
3. Execute the SQL

### Option 2: Manual Setup via Supabase Dashboard

1. **Create Bucket**
   - Navigate to Storage in Supabase Dashboard
   - Click "New Bucket"
   - Name: `training-resources`
   - Public bucket: ✅ Yes
   - File size limit: 10MB (recommended)
   - Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `text/plain`

2. **Create Policies**

   Go to Storage → Policies and create the following:

   **Upload Policy (INSERT)**
   ```sql
   CREATE POLICY "Admins can upload training resources"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'training-resources' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role = 'admin'
     )
   );
   ```

   **Update Policy**
   ```sql
   CREATE POLICY "Admins can update training resources"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'training-resources' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role = 'admin'
     )
   )
   WITH CHECK (
     bucket_id = 'training-resources' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role = 'admin'
     )
   );
   ```

   **Delete Policy**
   ```sql
   CREATE POLICY "Admins can delete training resources"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'training-resources' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role = 'admin'
     )
   );
   ```

   **Public Read Policy (SELECT)**
   ```sql
   CREATE POLICY "Authenticated users can view training resources"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'training-resources');
   ```

## Folder Structure

Files are organized by type and timestamp:
```
training-resources/
├── training/
│   ├── 1234567890-onboarding-guide.pdf
│   ├── 1234567891-sales-handbook.docx
│   └── 1234567892-marketing-templates.pptx
```

## Security

- ✅ Only admins can upload/update/delete training resources
- ✅ All authenticated users can view and download resources
- ✅ 10MB file size limit enforced client-side
- ✅ Accepted file types: PDF, Word, Excel, PowerPoint, Text files

## Usage

The Training & Resources page provides:
- **For Admins**:
  - "Add Resource" button to create new training materials
  - Three resource types: Videos (YouTube), Documents (Upload), FAQ/Knowledge Base
  - Drag and drop file upload for documents
  - Form fields for title, description, category
  - File validation (type and size)
  - Upload progress indicators
  - Public URL generation

- **For All Users**:
  - View training videos, documents, and FAQs
  - Download documents
  - Search knowledge base
  - Filter by category

## Testing

1. Log in as an admin
2. Navigate to Training & Resources
3. Click "Add Resource"
4. Select "Document (Upload File)" as resource type
5. Fill in title and description
6. Drag and drop a PDF or click to browse
7. Verify the file uploads and displays correctly
8. Submit the form
9. Verify the resource appears in the document list
10. Log in as a non-admin user
11. Verify they can view and download the document but cannot add new resources

## Troubleshooting

**Upload fails with "not allowed"**
- Check that the user is an admin
- Verify the storage policies are created correctly
- Check browser console for specific error messages

**Documents don't display**
- Verify bucket is set to public
- Check the public URL format matches: `https://{project}.supabase.co/storage/v1/object/public/training-resources/training/{filename}`

**Large files fail**
- Confirm file is under 10MB
- Check browser network tab for 413 errors
- Consider compressing large files

**Admin check fails**
- Verify user has `role = 'admin'` in the users table
- Check the RLS policies include the admin role check
- Ensure auth context is properly set
