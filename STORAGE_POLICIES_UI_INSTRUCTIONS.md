# Fix Document Upload "Bucket not found" Error via Supabase UI

## Issue
Agents cannot upload documents because user-specific INSERT/DELETE/UPDATE policies are missing.

## Solution
Add 3 new storage policies via the Supabase Dashboard UI.

---

## Step-by-Step Instructions

### 1. Navigate to Storage Policies

1. Go to **Supabase Dashboard** → https://supabase.com/dashboard
2. Select your project: **reapex-portal**
3. In the left sidebar, click **Storage**
4. Click on **Policies** tab (top of page)
5. You should see the `objects` table with existing policies

### 2. Add Policy #1: Users can upload to their own folder

Click **New Policy** button, then:

**Policy Name:**
```
Users can upload to their own folder
```

**Allowed Operation:**
- Select: `INSERT`

**Target Roles:**
- Select: `authenticated`

**USING expression:** (leave empty for INSERT)

**WITH CHECK expression:**
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] = auth.uid()::text
```

**Policy command:** `FOR INSERT TO authenticated`

Click **Review** → **Save Policy**

---

### 3. Add Policy #2: Users can delete their own files

Click **New Policy** button, then:

**Policy Name:**
```
Users can delete their own files
```

**Allowed Operation:**
- Select: `DELETE`

**Target Roles:**
- Select: `authenticated`

**USING expression:**
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] = auth.uid()::text
```

**WITH CHECK expression:** (leave empty for DELETE)

**Policy command:** `FOR DELETE TO authenticated`

Click **Review** → **Save Policy**

---

### 4. Add Policy #3: Users can update their own files

Click **New Policy** button, then:

**Policy Name:**
```
Users can update their own files
```

**Allowed Operation:**
- Select: `UPDATE`

**Target Roles:**
- Select: `authenticated`

**USING expression:**
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] = auth.uid()::text
```

**WITH CHECK expression:** (leave empty for UPDATE)

**Policy command:** `FOR UPDATE TO authenticated`

Click **Review** → **Save Policy**

---

## 5. Verify Policies Were Created

Go back to **SQL Editor** and run:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY cmd, policyname;
```

**Expected Result:** You should now see **11 policies** (was 8, added 3 more):
- 2 DELETE policies (admin + user)
- 3 INSERT policies (admin + user + public)
- 3 SELECT policies (admin + user)
- 3 UPDATE policies (admin + user)

---

## 6. Test Document Upload

1. Log in as an agent
2. Go to a transaction page
3. Try to upload a document
4. Should work without "Bucket not found" error

---

## Alternative: Use SQL (if you have superuser access)

If you have postgres/superuser access, you can run the migration file directly:

**File:** `/supabase/migrations/087_add_user_documents_rls_policies.sql`

**How to run:**
1. Open Supabase SQL Editor
2. Click "New Query"
3. Copy the entire contents of the migration file
4. Click "Run"

If you get "must be owner of relation objects" error, use the UI method above instead.

---

## What These Policies Do

### Policy Logic Explanation

**File Path Structure:**
```
documents/{user_id}/transactions/{transaction_id}/{timestamp}.{ext}
```

**Policy Check:**
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This extracts the **first folder** in the file path and checks if it matches the authenticated user's ID.

**Example:**
- User ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- File path: `a1b2c3d4-e5f6-7890-abcd-ef1234567890/transactions/trans-123/contract.pdf`
- First folder: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Policy result: ✅ ALLOW (matches user ID)

**Example (different user trying to access):**
- User ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- File path: `a1b2c3d4-e5f6-7890-abcd-ef1234567890/transactions/trans-123/contract.pdf`
- First folder: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Policy result: ❌ DENY (doesn't match user ID)

### Combined with Existing Policies

**Agents:**
- ✅ Can upload to their own folder (new policy)
- ✅ Can delete from their own folder (new policy)
- ✅ Can update files in their own folder (new policy)
- ✅ Can view all documents (existing "Authenticated users can view documents" policy)

**Admins/Brokers:**
- ✅ Can manage all documents (existing "Admins can manage all documents" policy)
- ✅ Can view all documents (existing policy)
- ✅ Can delete any documents (existing policy)
- ✅ Can update any documents (existing policy)

---

## Troubleshooting

**Issue: Can't find "New Policy" button**
- Make sure you're in: Storage → Policies → objects table

**Issue: Policy creation fails**
- Verify the SQL expressions exactly match the examples above
- Check that you selected the correct operation (INSERT/DELETE/UPDATE)
- Ensure "authenticated" is selected as the target role

**Issue: Still getting "Bucket not found" after adding policies**
- Clear browser cache and refresh
- Check file path structure in code matches `{user_id}/transactions/...`
- Verify uploaded_by user ID matches authenticated user
- Run diagnostic queries from `/supabase/DIAGNOSTIC_QUERIES.sql` Step 3 to check file paths
