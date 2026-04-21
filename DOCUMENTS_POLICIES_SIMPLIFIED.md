# Simplified Documents Bucket Policies (Using UI)

## Why This Approach?

Using the **same pattern as `support-attachments` bucket** - consolidates user + admin logic in single policies instead of separate ones. Cleaner and easier to maintain.

---

## Add 4 Policies via Supabase Dashboard

### 1. Navigate to Storage Policies

1. **Supabase Dashboard** → https://supabase.com/dashboard
2. Select project: **reapex-portal**
3. Left sidebar → **Storage** → **Policies** tab
4. Find the `objects` table

---

### 2. Policy #1: Agents can view own documents

**Policy Name:**
```
Agents can view own documents
```

**Allowed Operation:** `SELECT`

**Target Roles:** `authenticated`

**USING expression:**
```sql
bucket_id = 'documents' AND
(auth.uid()::text = (storage.foldername(name))[1] OR
 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
```

**WITH CHECK expression:** *(leave empty)*

Click **Save Policy**

---

### 3. Policy #2: Agents can upload own documents

**Policy Name:**
```
Agents can upload own documents
```

**Allowed Operation:** `INSERT`

**Target Roles:** `authenticated`

**USING expression:** *(leave empty for INSERT)*

**WITH CHECK expression:**
```sql
bucket_id = 'documents' AND
auth.uid()::text = (storage.foldername(name))[1]
```

Click **Save Policy**

---

### 4. Policy #3: Agents can delete own documents

**Policy Name:**
```
Agents can delete own documents
```

**Allowed Operation:** `DELETE`

**Target Roles:** `authenticated`

**USING expression:**
```sql
bucket_id = 'documents' AND
(auth.uid()::text = (storage.foldername(name))[1] OR
 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
```

**WITH CHECK expression:** *(leave empty)*

Click **Save Policy**

---

### 5. Policy #4: Agents can update own documents

**Policy Name:**
```
Agents can update own documents
```

**Allowed Operation:** `UPDATE`

**Target Roles:** `authenticated`

**USING expression:**
```sql
bucket_id = 'documents' AND
(auth.uid()::text = (storage.foldername(name))[1] OR
 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent', 'broker')))
```

**WITH CHECK expression:** *(leave empty)*

Click **Save Policy**

---

## What This Does

### Pattern Explanation

**For Regular Users (Agents):**
- ✅ Can upload to their own folder: `user-id/transactions/...`
- ✅ Can view files in their own folder
- ✅ Can delete files from their own folder
- ✅ Can update files in their own folder

**For Admins/Admin_Agents/Brokers:**
- ✅ Can view ALL documents (any folder)
- ✅ Can delete ALL documents (any folder)
- ✅ Can update ALL documents (any folder)
- ⚠️ Cannot upload to other users' folders (INSERT policy only allows own folder)

**Admin Upload Behavior:**
- Admins can upload, but the file must be in a folder structure like `{admin-user-id}/...`
- This is by design to maintain file ownership tracking
- If admins need to upload on behalf of agents, the application should handle this logic

---

## Verify Policies

After adding all 4 policies, run in SQL Editor:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND qual::text LIKE '%documents%'
ORDER BY cmd, policyname;
```

**Expected:** Should see 4 policies for documents bucket:
1. DELETE: Agents can delete own documents
2. INSERT: Agents can upload own documents
3. SELECT: Agents can view own documents
4. UPDATE: Agents can update own documents

---

## Alternative: SQL Migration

If you have superuser access, run:
`/supabase/migrations/088_documents_policies_consolidated.sql`

This will:
- Drop all existing document policies (clean slate)
- Create 4 new consolidated policies
- Works exactly like support-attachments pattern

---

## Benefits Over Separate Policies

**Old Approach:** 6-8 separate policies
- User INSERT policy
- User DELETE policy
- User UPDATE policy
- User SELECT policy
- Admin INSERT policy
- Admin DELETE policy
- Admin UPDATE policy
- Admin SELECT policy

**New Approach:** 4 consolidated policies
- One SELECT policy (users see own, admins see all)
- One INSERT policy (everyone uploads to own folder only)
- One DELETE policy (users delete own, admins delete all)
- One UPDATE policy (users update own, admins update all)

**Result:** Simpler, cleaner, easier to maintain!
