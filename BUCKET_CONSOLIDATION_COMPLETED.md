# Bucket Consolidation - COMPLETED ✅

All code updates and migrations have been successfully completed. All admin-managed uploads now use the consolidated `documents` bucket with folder-based organization.

---

## ✅ What Was Completed

### 1. Database Migration
- ✅ Updated documents bucket configuration to support all MIME types
- ✅ Added support for: video/mp4, image/svg+xml, and all document types
- ✅ Set file size limit to 50MB (Supabase maximum)

### 2. File Migration
- ✅ **11 files successfully migrated** to new folder structure:
  - 10 training files → `documents/training/` (videos, PDFs, thumbnails)
  - 1 logo file → `documents/logos/`
  - 4 brokerage documents updated with `forms/` prefix in database

**Migration Script**: `/scripts/migrate-to-consolidated-buckets.ts`

### 3. Code Updates

#### ManageResources.tsx (6 changes) ✅
1. ✅ Updated `uploadFile` function to use folder parameter instead of bucket
2. ✅ Forms upload → `documents` bucket, `forms/` folder
3. ✅ Training file upload → `documents` bucket, `training/` folder
4. ✅ Training thumbnail upload → `documents` bucket, `training/` folder
5. ✅ Marketing preview upload → `documents` bucket, `marketing/` folder
6. ✅ Links logo upload → `documents` bucket, `logos/` folder
7. ✅ Delete function → Always uses `documents` bucket

#### Dashboard Pages (3 files) ✅
1. ✅ `/app/(dashboard)/training/page.tsx` → Uses `documents` bucket
2. ✅ `/app/(dashboard)/dashboard/external-links/page.tsx` → Uses `documents` bucket
3. ✅ `/app/(dashboard)/admin/external-links/page.tsx` → Uses `documents` bucket
4. ✅ `/app/(dashboard)/quick-forms/page.tsx` → Already using `documents` bucket

---

## 📂 New Folder Structure

```
documents/
├── marketing/          # Marketing assets, template previews (admin-only write)
├── forms/             # Brokerage forms, documents (admin-only write)
├── training/          # Training videos, PDFs, thumbnails (admin-only write)
├── logos/             # External link logos/icons (admin-only write)
└── {user-id}/         # Transaction documents (user + admin write)
    └── transactions/
```

---

## 🔐 RLS Policies - ACTION REQUIRED

**⚠️ You must run the SQL to create RLS policies**

### Option 1: SQL Editor (Recommended)
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of: **`RLS_POLICIES_FOR_DOCUMENTS_BUCKET.sql`**
4. Click **Run**
5. Verify 5 policies were created (query at bottom of SQL file)

### Option 2: Supabase Dashboard UI
If SQL Editor gives permission errors, follow these steps:

1. Go to **Storage** → **Policies** in Supabase Dashboard
2. Find **documents** bucket section
3. Add 5 policies manually (details in `RLS_POLICIES_FOR_DOCUMENTS_BUCKET.sql`)

### The 5 Required Policies:
1. **SELECT**: All authenticated users can view documents
2. **INSERT**: Admins can upload to admin folders (marketing, forms, training, logos)
3. **INSERT**: Users can upload to own folder ({user-id}/)
4. **DELETE**: Delete based on folder ownership
5. **UPDATE**: Update based on folder ownership

---

## ✅ Testing Checklist

Run these tests after creating RLS policies:

### Admin Tests
- [ ] Upload brokerage form → Should save to `documents/forms/`
- [ ] Upload training video → Should save to `documents/training/`
- [ ] Upload training thumbnail → Should save to `documents/training/thumbnails/`
- [ ] Upload marketing preview → Should save to `documents/marketing/`
- [ ] Upload external link logo → Should save to `documents/logos/`
- [ ] Delete each resource type → Should remove from `documents` bucket
- [ ] View all resources → Should display correctly with images/files

### Agent Tests
- [ ] View brokerage forms → Can see all forms
- [ ] View training resources → Can access videos and PDFs
- [ ] View marketing templates → Can see all templates
- [ ] View external links → Can see all links with logos
- [ ] Upload transaction document → Should save to `documents/{agent-user-id}/`
- [ ] Cannot upload to admin folders → Should be blocked by RLS

---

## 📊 Migration Summary

**Before:** 8+ separate buckets with individual policies per bucket
**After:** 1 consolidated bucket with 5 folder-based policies

### Benefits:
- ✅ Simpler management (1 bucket vs 8)
- ✅ Consistent permissions across all resource types
- ✅ Easier to add new resource types (just add folder)
- ✅ Better organization with clear folder structure
- ✅ Unified file size limits and MIME types
- ✅ Cleaner codebase (single bucket reference)

---

## 🧹 Optional Cleanup (After Verification)

Once you've verified everything works correctly:

### 1. Delete Old Buckets
```sql
-- In Supabase SQL Editor (only after verifying new setup works!)
DELETE FROM storage.buckets WHERE id = 'marketing-files';
DELETE FROM storage.buckets WHERE id = 'training-resources';
DELETE FROM storage.buckets WHERE id = 'external-links';
```

### 2. Remove Migration Scripts (Optional)
- `/scripts/migrate-to-consolidated-buckets.ts`
- `/scripts/migrate-to-consolidated-buckets.js`
- `/scripts/update-documents-bucket-config.ts`
- `/scripts/update-documents-bucket-config.js`

---

## 📝 Files Created/Modified

### SQL Files
- ✅ `/RLS_POLICIES_FOR_DOCUMENTS_BUCKET.sql` - **RUN THIS FIRST**
- `/supabase/migrations/089_consolidate_buckets_folder_based.sql` (reference only)

### Documentation
- `/BUCKET_CONSOLIDATION_GUIDE.md` - Complete reference guide
- `/MANAGE_RESOURCES_UPDATE.md` - ManageResources.tsx changes
- `/CONSOLIDATION_README.md` - Quick start guide
- `/BUCKET_CONSOLIDATION_COMPLETED.md` - This file

### Migration Scripts
- `/scripts/migrate-to-consolidated-buckets.ts` - File migration (completed)
- `/scripts/update-documents-bucket-config.ts` - Bucket config update (completed)

### Code Changes
- ✅ `components/admin/ManageResources.tsx` - 6 changes
- ✅ `app/(dashboard)/training/page.tsx` - 1 change
- ✅ `app/(dashboard)/dashboard/external-links/page.tsx` - 1 change
- ✅ `app/(dashboard)/admin/external-links/page.tsx` - 1 change

---

## 🚀 Next Steps

1. **Create RLS Policies** (Required)
   - Run `/RLS_POLICIES_FOR_DOCUMENTS_BUCKET.sql` in Supabase SQL Editor
   - Verify 5 policies were created

2. **Test Everything** (Required)
   - Follow testing checklist above
   - Test as both admin and agent users

3. **Clean Up Old Buckets** (Optional)
   - Only after verifying everything works!
   - Delete old buckets: marketing-files, training-resources, external-links

---

## 🆘 Troubleshooting

### Issue: SQL Permission Error
**Error**: `ERROR: 42501: must be owner of relation objects`

**Solution**: Use Supabase Dashboard UI instead:
1. Go to Storage → Policies
2. Add policies manually for documents bucket
3. Use policy SQL from `/RLS_POLICIES_FOR_DOCUMENTS_BUCKET.sql`

### Issue: Files Not Displaying
**Check**:
1. Verify file paths have folder prefixes (forms/, training/, etc.)
2. Check browser console for 404 errors
3. Verify RLS policies exist with verification query
4. Check user role in database

### Issue: Upload Failing
**Check**:
1. Verify MIME type is allowed (run bucket config update script again if needed)
2. Check file size (must be < 50MB)
3. Verify RLS INSERT policies exist
4. Check user role for admin folder uploads

---

## 📞 Support

For issues with this consolidation:
1. Check troubleshooting section above
2. Review logs in browser console and Supabase logs
3. Verify RLS policies with verification query
4. Check file paths in database have correct folder prefixes

---

**Status**: ✅ Code migration complete - awaiting RLS policy creation
**Last Updated**: December 2024
