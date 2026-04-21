# Fix: "Bucket not found" Error for Document Viewing

## Problem
Agents and admins are unable to view uploaded documents, receiving error:
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

## Root Cause
The code references a storage bucket named `'documents'` that **does not exist** in Supabase Storage.

## Solution
Create the missing `'documents'` bucket by executing the provided SQL script in Supabase.

---

## Step-by-Step Fix Instructions

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project: **reapex-portal**

### 2. Navigate to SQL Editor
- In the left sidebar, click **SQL Editor**
- Click **New Query** button

### 3. Execute the SQL Script
- Open the file: `/supabase/EXECUTE_IN_SUPABASE.sql`
- Copy the **entire** contents
- Paste into the Supabase SQL Editor
- Click **Run** (or press Cmd/Ctrl + Enter)

### 4. Verify Bucket Creation
After running the script, verify success:

**Option A: Check Storage Tab**
1. Go to **Storage** in left sidebar
2. You should now see a bucket named **documents**
3. Click on it - it should be empty (or contain migrated files)

**Option B: Run Verification Queries**
The SQL script includes verification queries at the bottom:
```sql
-- 1. Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- 2. Verify policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%document%'
ORDER BY policyname;
```

### 5. Test Document Functionality

**As an Agent:**
1. Go to a transaction page
2. Click Documents tab
3. Try to upload a document
4. Verify upload succeeds
5. Click the uploaded document to view/download
6. Should work without "Bucket not found" error

**As an Admin:**
1. Go to Admin > Brokerage Documents
2. Upload a document for all users
3. Verify agents can see and download it

---

## What the SQL Script Does

### Creates the 'documents' Bucket
- **Name**: `documents`
- **Access**: Private (not publicly accessible)
- **File Size Limit**: 50MB per file
- **Allowed File Types**:
  - PDF (application/pdf)
  - Word Documents (.doc, .docx)
  - Plain Text (.txt)
  - Images (.png, .jpg, .jpeg)

### Creates 6 RLS Policies

**For Regular Users (Agents):**
1. **Upload**: Can upload to their own folder (user_id/...)
2. **Read**: Can read files from their own folder
3. **Delete**: Can delete files from their own folder

**For Admin-Level Users (admin, admin_agent, broker):**
4. **Upload**: Can upload to any folder
5. **Read**: Can read any files
6. **Delete**: Can delete any files

---

## File Structure in 'documents' Bucket

Files are organized by user ID:
```
documents/
├── {user_id_1}/
│   ├── transactions/
│   │   ├── {transaction_id}/
│   │   │   └── contract.pdf
│   │   └── ...
│   └── brokerage/
│       └── form.pdf
├── {user_id_2}/
│   └── ...
└── ...
```

---

## Code Files Affected (No Changes Needed)

The following files already reference the `'documents'` bucket correctly:

**Upload Operations:**
- `/components/upload/DocumentUpload.tsx`
- `/app/(dashboard)/transactions/[id]/page.tsx`
- `/components/dashboard/business/TransactionsTab.tsx`
- `/app/(dashboard)/admin/brokerage-documents/page.tsx`
- `/app/(dashboard)/admin/commission-payouts/page.tsx`
- `/components/transactions/CommissionStatementModal.tsx`

**Download/View Operations:**
- `/components/transactions/TransactionDocumentLibrary.tsx`
- `/components/modals/FilePreviewModal.tsx`
- `/app/(dashboard)/quick-forms/page.tsx`
- `/app/(dashboard)/dashboard/forms/page.tsx`

**Delete Operations:**
- All pages with download also support delete

Once the bucket is created, all these files will work correctly.

---

## Troubleshooting

### Issue: SQL execution fails with "bucket already exists"
**Solution**: The bucket was created but policies may be missing. Run just the policy creation part (lines 33-111 of the SQL file).

### Issue: Agent still can't view documents after creating bucket
**Possible Causes:**
1. **RLS policies not created**: Run the verification queries to check
2. **Documents in wrong folder**: Files must be in `{user_id}/...` structure
3. **Old documents in different bucket**: May need to migrate files

### Issue: Admin can't view documents uploaded by agents
**Check**: Ensure admin user has role `'admin'`, `'admin_agent'`, or `'broker'` in the `users` table.

### Issue: Verification query shows no policies
**Solution**: Re-run the entire SQL script. Policies depend on bucket existing first.

---

## Migration History

This fix aligns with these existing migrations:
- `041_create_documents_storage.sql` - Creates bucket (enhanced in this fix to include all admin roles)
- `060_fix_storage_policies.sql` - Additional storage policy fixes
- `061_fix_documents_storage_policy.sql` - Document-specific policy fixes

**Note**: The original migration 041 only included `'admin'` role. The new script includes `'admin_agent'` and `'broker'` roles for proper admin-level access.

---

## Post-Fix Checklist

After executing the SQL:
- [ ] Bucket 'documents' appears in Supabase Storage
- [ ] 6 RLS policies exist for storage.objects
- [ ] Agent can upload transaction document
- [ ] Agent can view their own documents
- [ ] Agent cannot view other agents' documents
- [ ] Admin can upload documents to any folder
- [ ] Admin can view all documents
- [ ] Document preview modal works
- [ ] Document download works
- [ ] No "Bucket not found" errors in console

---

## Support

If you encounter issues after following these steps:
1. Check Supabase logs for detailed error messages
2. Verify the user's role in the `users` table
3. Check browser console for client-side errors
4. Ensure the file path matches the expected structure

---

## Technical Details

### Why This Happened
The `'documents'` bucket either:
- Was never created (migration 041 not run)
- Was manually deleted from Supabase dashboard
- Failed to create due to migration error

### Why Agents Need Their Own Folder
The RLS policy checks `(storage.foldername(name))[1] = auth.uid()::text`, which means:
- File path: `documents/{user_id}/transactions/file.pdf`
- First folder in path must match authenticated user's ID
- This ensures users can only access their own files
- Admins bypass this check via separate admin policies
