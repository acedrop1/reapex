# Debugging "Bucket not found" Error

## Issue
Agents and admins getting error when viewing documents:
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

**BUT** the 'documents' bucket EXISTS in Supabase Storage dashboard.

## Root Cause Investigation

Since the bucket exists, the error is caused by one of these issues:

1. **Project URL Mismatch** - Code pointing to different Supabase project
2. **RLS Policy Blocking** - Access denied but error message is misleading
3. **File Path Issues** - Incorrect path stored in database
4. **Mock Auth Issues** - Dev mode auth not working with storage

---

## Step 1: Verify Supabase Project URL

### Check Environment Variables

```bash
cd /Users/imranmehkri/Desktop/reapex-portal
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local
```

**Expected Output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://vwbqtrffvbpkmxfuenrs.supabase.co
```

**Verify:**
- Does this match the Supabase project in your screenshot?
- Is there a typo in the URL?
- Are you looking at a different project (staging vs production)?

### Check at Runtime

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to view a document
4. Look for request to Supabase storage API
5. URL should be: `https://vwbqtrffvbpkmxfuenrs.supabase.co/storage/v1/...`

**If URL is different**, your `.env.local` has the wrong project URL.

---

## Step 2: Check Browser Console Errors

### Get Full Error Details

1. Open browser DevTools Console (F12 → Console tab)
2. Clear console (trash icon)
3. Try to view/download a document
4. Look for error messages

### What to Look For

**Good** (expected if bucket name is correct):
```javascript
[FilePreviewModal] Storage API error: {
  error: { statusCode: 404, error: 'Bucket not found', message: 'Bucket not found' },
  fileName: 'contract.pdf',
  fileUrl: 'user-id/transactions/trans-id/file.pdf'
}
```

**Check**:
- What is the `fileUrl` value?
- Does it include "documents/" at the start? (it shouldn't!)
- Does it have the correct user ID?

---

## Step 3: Check Database File Paths

### Run SQL Query in Supabase

Go to Supabase SQL Editor and run:

```sql
SELECT
  id,
  document_type,
  file_name,
  file_url,
  uploaded_by,
  created_at
FROM transaction_documents
ORDER BY created_at DESC
LIMIT 10;
```

### Analyze file_url Column

**CORRECT format:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/transactions/trans-id-123/1234567890.pdf
```

**INCORRECT format (will cause errors):**
```
documents/a1b2c3d4-e5f6-7890-abcd-ef1234567890/transactions/...
```

The `file_url` should NOT include the bucket name "documents/".

**If file_url includes "documents/":**
- This is the problem!
- Files were uploaded with incorrect path
- Need to fix upload code and/or migrate existing files

---

## Step 4: Check RLS Policies

### Run Diagnostic Query

In Supabase SQL Editor, run:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY policyname;
```

### Expected Results (6 policies)

1. Admins can delete any documents (DELETE)
2. Admins can read any documents (SELECT)
3. Admins can upload any documents (INSERT)
4. Users can delete their own files (DELETE)
5. Users can read their own files (SELECT)
6. Users can upload to their own folder (INSERT)

**If you see 0 policies:**
- RLS policies were never created
- Run `/supabase/EXECUTE_IN_SUPABASE.sql` to create them

**If you see < 6 policies:**
- Some policies are missing
- Run `/supabase/EXECUTE_IN_SUPABASE.sql` to recreate all

---

## Step 5: Test with Different User Roles

### As Agent (Regular User)

1. Log in as agent
2. Go to transaction page
3. Upload a document
4. Note the uploaded_by user ID
5. Try to view the document

**Expected**: Should work if viewing own documents

### As Admin

1. Log in as admin
2. Try to view documents uploaded by agents
3. Check your role in database:
```sql
SELECT id, email, role FROM users WHERE email = 'your-admin-email@re-apex.com';
```

**Expected**: Role should be 'admin', 'admin_agent', or 'broker'

---

## Step 6: Check for Dev Mode Issues

### If Using BYPASS_AUTH in Development

Check `.env.local`:
```bash
grep "BYPASS_AUTH" .env.local
```

If `BYPASS_AUTH=true`:

**Issue**: Mock user ID `'00000000-0000-0000-0000-000000000000'` might not match actual uploaded files.

**Test**:
1. Temporarily set `BYPASS_AUTH=false` in `.env.local`
2. Restart Next.js dev server: `npm run dev`
3. Log in with real credentials
4. Try to upload and view a document

**If it works with real auth but not mock auth:**
- Issue is with mock user configuration
- Storage RLS policies don't recognize mock auth
- Consider using service role key in dev mode for storage operations

---

## Step 7: Test Storage API Directly

### Manual Storage Test

In browser console, run this test:

```javascript
// Get Supabase client
const { createClient } = window.supabase || {};
const supabase = createClient(
  'https://vwbqtrffvbpkmxfuenrs.supabase.co',
  'YOUR_ANON_KEY_HERE'
);

// Test bucket access
const { data, error } = await supabase.storage
  .from('documents')
  .list('', { limit: 10 });

console.log('Bucket test:', { data, error });
```

**Expected Results:**
- **Success**: `{ data: [...files...], error: null }`
- **Bucket not found**: `{ data: null, error: { statusCode: 404, message: 'Bucket not found' } }`
- **Permission denied**: `{ data: null, error: { statusCode: 403, message: 'Forbidden' } }`

**If bucket not found with this test:**
- Verify the URL in the test matches your .env.local
- Verify anon key is correct
- You might be testing against wrong project

---

## Common Fixes

### Fix 1: Project URL Mismatch

**Problem**: `.env.local` has wrong Supabase URL

**Solution**:
```bash
# Update .env.local
NEXT_PUBLIC_SUPABASE_URL=https://vwbqtrffvbpkmxfuenrs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-correct-anon-key-here
```

Restart dev server: `npm run dev`

### Fix 2: Missing RLS Policies

**Problem**: Storage RLS policies don't exist

**Solution**:
1. Run `/supabase/EXECUTE_IN_SUPABASE.sql` in Supabase SQL Editor
2. Verify 6 policies created with diagnostic queries

### Fix 3: Incorrect File Paths

**Problem**: file_url contains "documents/" prefix

**Solution**:
```sql
-- Remove "documents/" prefix from all file paths
UPDATE transaction_documents
SET file_url = REPLACE(file_url, 'documents/', '')
WHERE file_url LIKE 'documents/%';
```

### Fix 4: Mock Auth Storage Issues

**Problem**: BYPASS_AUTH mock user doesn't work with storage

**Solution A** - Use service role in dev (bypass RLS):
```typescript
// In lib/supabase/client.ts for dev only
if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
  // Use service role for storage operations
  client.storage._url = client.storage._url // keep existing
  // Override headers to use service role for storage
}
```

**Solution B** - Create mock user in database:
```sql
-- Create the mock user in database
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@re-apex.com',
  'mock-password-dev-only',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@re-apex.com',
  'admin'
)
ON CONFLICT (id) DO NOTHING;
```

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] `.env.local` has correct NEXT_PUBLIC_SUPABASE_URL
- [ ] Browser Network tab shows correct Supabase project URL
- [ ] `documents` bucket exists in Supabase Storage
- [ ] 6 RLS policies exist on `storage.objects`
- [ ] `file_url` in database does NOT start with "documents/"
- [ ] User role is 'admin', 'admin_agent', or 'broker' for admins
- [ ] uploaded_by user IDs exist in users table
- [ ] No console errors about authentication
- [ ] Storage API test in browser console works

---

## Next Steps

After running diagnostics:

1. **If project URL mismatch**: Update `.env.local` and restart
2. **If missing policies**: Run `/supabase/EXECUTE_IN_SUPABASE.sql`
3. **If incorrect file paths**: Run UPDATE query to fix paths
4. **If mock auth issue**: Use real auth or service role in dev

## Getting Help

If still stuck, provide:
1. Output of diagnostic SQL queries
2. Browser console error (full object)
3. Value of NEXT_PUBLIC_SUPABASE_URL from `.env.local`
4. Output of storage API test from browser console
