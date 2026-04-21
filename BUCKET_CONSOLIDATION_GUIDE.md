# Storage Bucket Consolidation Guide

## Overview

Consolidate all admin-managed uploads into the `documents` bucket with folder-based organization and RLS policies.

---

## 🗂️ New Folder Structure

```
documents/
├── marketing/          # Marketing assets, template previews (admin-only write)
├── forms/             # Brokerage forms, documents (admin-only write)
├── training/          # Training videos, PDFs, thumbnails (admin-only write)
├── logos/             # External link logos/icons (admin-only write)
└── {user-id}/         # Transaction documents (user + admin write)
    └── transactions/
        └── {transaction-id}/
            └── file.pdf
```

---

## 📋 Migration Steps

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
/supabase/migrations/089_consolidate_buckets_folder_based.sql
```

This creates:
- ✅ 5 folder-based RLS policies
- ✅ Updated bucket configuration (100MB limit, all MIME types)
- ✅ Drops old separate policies

**Expected Policies:**
1. All authenticated users can view documents (SELECT)
2. Admins can upload to admin folders (INSERT - marketing, forms, training, logos)
3. Users can upload to own folder (INSERT - {user-id}/)
4. Delete based on folder ownership (DELETE)
5. Update based on folder ownership (UPDATE)

### 2. Migrate Existing Files

```bash
# Compile and run TypeScript migration script
cd /Users/imranmehkri/Desktop/reapex-portal

# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Compile TypeScript
npx tsc scripts/migrate-to-consolidated-buckets.ts --esModuleInterop --resolveJsonModule

# Run migration
node scripts/migrate-to-consolidated-buckets.js
```

This will:
- ✅ Copy files from `marketing-files` → `documents/marketing/`
- ✅ Copy files from `training-resources` → `documents/training/`
- ✅ Copy files from `external-links` → `documents/logos/`
- ✅ Update database references with new paths
- ✅ Show detailed migration summary

### 3. Update Code

Update all components to use `documents` bucket with folder prefixes:

#### A. ManageResources.tsx

**Current buckets:**
- Forms: No uploads (metadata only)
- Training: `training-resources`
- Marketing: `brand-assets`
- Links: `external-links`

**New folder prefixes:**
- Forms: `documents` bucket, `forms/` folder
- Training: `documents` bucket, `training/` folder
- Marketing: `documents` bucket, `marketing/` folder
- Links: `documents` bucket, `logos/` folder

**Changes needed:**

```typescript
// Line ~290: Update uploadFile function
const uploadFile = async (file: File, folder: string, filename: string) => {
    const path = `${folder}/${filename}`;
    const { data, error } = await supabase.storage
        .from('documents')  // Always use documents bucket
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;
    return data.path;
};

// Line ~298: Update form uploads (brokerage documents)
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'forms', fileName);
}

// Line ~318: Update training uploads
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'training', fileName);
}
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'training', iconName);
}

// Line ~345: Update marketing uploads
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'marketing', iconName);
}

// Line ~366: Update link logo uploads
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'logos', iconName);
}

// Line ~413: Update delete function
const { error: storageError } = await supabase.storage
    .from('documents')  // Always use documents bucket
    .remove(filesToDelete);
```

#### B. Dashboard Pages

**Pages to update:**

1. **/app/(dashboard)/quick-forms/page.tsx**
   - Already uses `documents` bucket ✅
   - Update getPublicUrl to handle folder paths

2. **/app/(dashboard)/training/page.tsx**
   - Change: `.from('training_resources')` → `.from('documents')`
   - Paths now: `training/{filename}`

3. **/app/(dashboard)/marketing/page.tsx**
   - Already uses external Canva URLs ✅
   - Preview images: Update to `documents/marketing/`

4. **/app/(dashboard)/dashboard/external-links/page.tsx**
   - Change: `.from('external-links')` → `.from('documents')`
   - Paths now: `logos/{filename}`

5. **/app/(dashboard)/dashboard/training/page.tsx**
   - Change: `.from('training-resources')` → `.from('documents')`
   - Paths now: `training/{filename}`

#### C. API Routes

**Routes to update:**

None - API routes don't directly upload to these buckets. All uploads go through components.

---

## 🔧 Code Update Examples

### Example 1: Training Page

**Before:**
```typescript
const getFileUrl = (url: string | null) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  return supabase.storage.from('training_resources').getPublicUrl(url).data.publicUrl;
};
```

**After:**
```typescript
const getFileUrl = (url: string | null) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  // URL format: training/{filename} or old format without prefix
  const path = url.startsWith('training/') ? url : `training/${url}`;
  return supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;
};
```

### Example 2: External Links Page

**Before:**
```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('external-links')
  .upload(fileName, selectedLogo);
```

**After:**
```typescript
const fileName = `logos/${Date.now()}-${selectedLogo.name}`;
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('documents')
  .upload(fileName, selectedLogo);
```

### Example 3: Getting Public URLs

**Before:**
```typescript
<img
  src={supabase.storage.from('external-links').getPublicUrl(link.logo_url).data.publicUrl}
  alt={link.title}
/>
```

**After:**
```typescript
<img
  src={supabase.storage.from('documents').getPublicUrl(link.logo_url).data.publicUrl}
  alt={link.title}
/>
```

---

## ✅ Verification Checklist

After migration and code updates:

### Database Checks
- [ ] Run verification queries from migration 089
- [ ] Confirm 5 policies exist for documents bucket
- [ ] Verify brokerage_documents file_url starts with `forms/`
- [ ] Verify training_resources file_url starts with `training/`
- [ ] Verify external_links logo_url starts with `logos/`

### Functional Tests

**Admin Tests:**
- [ ] Upload new brokerage form → saves to `documents/forms/`
- [ ] Upload new training resource → saves to `documents/training/`
- [ ] Upload marketing template preview → saves to `documents/marketing/`
- [ ] Upload external link logo → saves to `documents/logos/`
- [ ] Delete each resource type → removes from `documents` bucket
- [ ] View/download each resource type → works correctly

**Agent Tests:**
- [ ] View brokerage forms → can access all forms
- [ ] View training resources → can access all videos/PDFs
- [ ] View marketing templates → can access all templates
- [ ] View external links → can access all links with logos
- [ ] Upload transaction document → saves to `documents/{user-id}/transactions/`
- [ ] Cannot upload to admin folders (marketing, forms, training, logos)

### Dashboard Pages
- [ ] /dashboard/forms → displays forms correctly
- [ ] /dashboard/training → plays videos, downloads PDFs
- [ ] /dashboard/marketing → shows template previews
- [ ] /dashboard/external-links → displays logos correctly
- [ ] /quick-forms → downloads forms correctly

---

## 🧹 Cleanup (After Verification)

Once everything works:

1. **Remove old bucket policies** (already dropped by migration 089)

2. **Delete old buckets** (optional, if you're sure all files are migrated):
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM storage.buckets WHERE id = 'marketing-files';
   DELETE FROM storage.buckets WHERE id = 'training-resources';
   -- Keep external-links if still has files, or delete after full verification
   ```

3. **Clean up code comments** referencing old buckets

---

## 🚨 Rollback Plan

If migration fails:

1. **Database:** Old policies are dropped, create new ones matching old structure
2. **Files:** Original files still exist in old buckets (migration copies, doesn't move)
3. **Database references:** Run migration script with `--rollback` flag to revert paths

**Rollback script:**
```sql
-- Revert brokerage_documents
UPDATE brokerage_documents
SET file_url = REPLACE(file_url, 'forms/', '')
WHERE file_url LIKE 'forms/%';

-- Revert training_resources
UPDATE training_resources
SET file_url = REPLACE(file_url, 'training/', '')
WHERE file_url LIKE 'training/%';

UPDATE training_resources
SET thumbnail_url = REPLACE(thumbnail_url, 'training/', '')
WHERE thumbnail_url LIKE 'training/%';

-- Revert external_links
UPDATE external_links
SET logo_url = REPLACE(logo_url, 'logos/', '')
WHERE logo_url LIKE 'logos/%';
```

---

## 📊 Benefits

**Before:** 8+ separate buckets with bucket-specific policies
**After:** 1 bucket with 5 folder-based policies

**Advantages:**
- ✅ Simplified management (1 bucket instead of 8)
- ✅ Consistent permissions model
- ✅ Easier to add new resource types (just add folder)
- ✅ Better organization with folder structure
- ✅ Unified file size limits and MIME types
- ✅ Cleaner codebase (single bucket reference)

---

## 📝 Summary of Changes

| Resource Type | Old Bucket | New Path | Old Policies | New Policies |
|---------------|-----------|----------|--------------|--------------|
| Forms | `documents` | `documents/forms/` | Separate user/admin | Folder-based |
| Training | `training-resources` | `documents/training/` | Bucket-specific | Folder-based |
| Marketing | `brand-assets` | `documents/marketing/` | Bucket-specific | Folder-based |
| Links | `external-links` | `documents/logos/` | Bucket-specific | Folder-based |
| Transactions | `documents` | `documents/{user-id}/` | User-specific | Folder-based |

**Files to update:** 7 components + 1 admin component
**Migrations to run:** 1 SQL + 1 data migration script
**Expected downtime:** None (migration copies files, code update is backwards-compatible)
