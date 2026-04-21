# Storage Bucket Consolidation - Quick Start

## 🎯 Goal

Consolidate all admin-managed uploads into the `documents` bucket with folder-based organization:

```
documents/
├── marketing/          # Admin-only write, all can view
├── forms/             # Admin-only write, all can view
├── training/          # Admin-only write, all can view
├── logos/             # Admin-only write, all can view
└── {user-id}/         # User + admin write, all can view
    └── transactions/
```

---

## 📁 Files Created

1. **`/supabase/migrations/089_consolidate_buckets_folder_based.sql`**
   - Creates 5 folder-based RLS policies
   - Updates documents bucket configuration
   - Drops old bucket-specific policies

2. **`/scripts/migrate-to-consolidated-buckets.ts`**
   - Copies files from old buckets to new folder structure
   - Updates database references with new paths
   - Provides detailed migration summary

3. **`/BUCKET_CONSOLIDATION_GUIDE.md`**
   - Complete step-by-step guide
   - Code update examples
   - Verification checklist
   - Rollback plan

4. **`/MANAGE_RESOURCES_UPDATE.md`**
   - Specific changes for ManageResources.tsx
   - Find/replace instructions
   - Testing guide

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor:
# Copy and run: /supabase/migrations/089_consolidate_buckets_folder_based.sql
```

**Verify:**
```sql
-- Should return 5 policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY cmd, policyname;
```

### Step 2: Migrate Files

```bash
# In terminal:
cd /Users/imranmehkri/Desktop/reapex-portal

# Compile TypeScript
npx tsc scripts/migrate-to-consolidated-buckets.ts --esModuleInterop --resolveJsonModule

# Run migration
node scripts/migrate-to-consolidated-buckets.js
```

**This will:**
- Copy marketing-files → documents/marketing/
- Copy training-resources → documents/training/
- Copy external-links → documents/logos/
- Update all database references

### Step 3: Update Code

Follow instructions in `/MANAGE_RESOURCES_UPDATE.md` to update:

**ManageResources.tsx** (6 changes):
1. uploadFile function → always use 'documents' bucket
2. Forms upload → 'forms/' folder
3. Training upload → 'training/' folder
4. Marketing upload → 'marketing/' folder
5. Links upload → 'logos/' folder
6. Delete function → 'documents' bucket

**Dashboard pages** (4 pages):
- `/app/(dashboard)/training/page.tsx`
- `/app/(dashboard)/dashboard/training/page.tsx`
- `/app/(dashboard)/dashboard/external-links/page.tsx`
- See BUCKET_CONSOLIDATION_GUIDE.md for examples

---

## ✅ Test Checklist

After completing all steps:

**Admin:**
- [ ] Upload brokerage form → saves to `documents/forms/`
- [ ] Upload training video → saves to `documents/training/`
- [ ] Upload marketing preview → saves to `documents/marketing/`
- [ ] Upload link logo → saves to `documents/logos/`
- [ ] Delete each resource type → removes correctly
- [ ] View all resources → displays correctly

**Agent:**
- [ ] View forms, training, marketing, links → all visible
- [ ] Cannot upload to admin folders
- [ ] Can upload transaction documents → saves to `documents/{user-id}/`

---

## 📊 Benefits

**Before:** 8+ buckets with separate policies per bucket
**After:** 1 bucket with 5 folder-based policies

- ✅ Simpler management (1 bucket vs 8)
- ✅ Consistent permissions
- ✅ Easier to add new resource types
- ✅ Better organization
- ✅ Cleaner codebase

---

## 🚨 Important Notes

1. **Migration is non-destructive** - Copies files, doesn't delete originals
2. **Backwards compatible** - Old files will work until migration completes
3. **Zero downtime** - Can be done without service interruption
4. **Rollback available** - See BUCKET_CONSOLIDATION_GUIDE.md

---

## 📚 Full Documentation

- **Complete Guide**: `/BUCKET_CONSOLIDATION_GUIDE.md`
- **Code Updates**: `/MANAGE_RESOURCES_UPDATE.md`
- **Migration**: `/scripts/migrate-to-consolidated-buckets.ts`
- **RLS Policies**: `/supabase/migrations/089_consolidate_buckets_folder_based.sql`

---

## 🆘 Need Help?

1. **Migration fails?** - Check rollback section in BUCKET_CONSOLIDATION_GUIDE.md
2. **Code errors?** - See examples in MANAGE_RESOURCES_UPDATE.md
3. **Policies not working?** - Verify 5 policies exist with verification query
4. **Files not copying?** - Check service role key in .env.local

---

## Order of Execution

1. ✅ Database migration (089_consolidate_buckets_folder_based.sql)
2. ✅ File migration (migrate-to-consolidated-buckets.ts)
3. ✅ Code updates (MANAGE_RESOURCES_UPDATE.md + BUCKET_CONSOLIDATION_GUIDE.md)
4. ✅ Testing (checklist above)
5. ✅ Cleanup old buckets (optional, after verification)
