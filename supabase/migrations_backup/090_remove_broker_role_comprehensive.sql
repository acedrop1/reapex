-- ============================================================================
-- COMPREHENSIVE BROKER ROLE REMOVAL
-- ============================================================================
-- Purpose: Remove all references to 'broker' role from RLS policies
-- Consolidate to: admin, admin_agent (admin privileges), agent (regular users)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop policies that depend on is_admin_or_broker()
-- ============================================================================

-- Drop transactions policies
DROP POLICY IF EXISTS "Approved users can view own transactions" ON transactions;

-- Drop training_resources policies
DROP POLICY IF EXISTS "Admins and brokers can insert training resources" ON training_resources;
DROP POLICY IF EXISTS "Admins and brokers can update training resources" ON training_resources;
DROP POLICY IF EXISTS "Admins and brokers can delete training resources" ON training_resources;

-- ============================================================================
-- STEP 2: Drop and recreate helper function
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS is_admin_or_broker();

-- Create new function with updated name
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'admin_agent')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Update Storage Policies (documents bucket)
-- ============================================================================

-- Drop existing policies for documents bucket
DROP POLICY IF EXISTS "Admins can upload to admin folders" ON storage.objects;
DROP POLICY IF EXISTS "Delete based on folder ownership" ON storage.objects;
DROP POLICY IF EXISTS "Update based on folder ownership" ON storage.objects;

-- Recreate without broker role
CREATE POLICY "Admins can upload to admin folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Delete based on folder ownership"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (
        (
            (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent')
            )
        )
        OR
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'admin_agent')
        )
    )
);

CREATE POLICY "Update based on folder ownership"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (
        (
            (storage.foldername(name))[1] IN ('marketing', 'forms', 'training', 'logos') AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent')
            )
        )
        OR
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'admin_agent')
        )
    )
);

-- ============================================================================
-- STEP 3: Update Calendar Events Policies
-- ============================================================================

DROP POLICY IF EXISTS "calendar_events_select_policy" ON calendar_events;

CREATE POLICY "calendar_events_select_policy"
ON calendar_events
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_public = true
    OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 4: Update Users Table Policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all users if admin/admin_agent" ON users;

CREATE POLICY "Users can view all users if admin/admin_agent"
ON users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 5: Update Listings Policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert any listing" ON listings;

CREATE POLICY "Admins can insert any listing"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 6: Update Notifications Policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

CREATE POLICY "Admins can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admins can delete notifications"
ON notifications
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 7: Update Agent Applications Policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all applications" ON agent_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON agent_applications;

CREATE POLICY "Admins can view all applications"
ON agent_applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admins can update applications"
ON agent_applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 8: Recreate Transactions and Training Resources Policies
-- ============================================================================

-- Recreate transactions policy
CREATE POLICY "Approved users can view own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_admin_role()
);

-- Recreate training_resources policies
CREATE POLICY "Admins can insert training resources"
ON training_resources
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admins can update training resources"
ON training_resources
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

CREATE POLICY "Admins can delete training resources"
ON training_resources
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that no policies reference broker role
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE qual::text ILIKE '%broker%'
   OR with_check::text ILIKE '%broker%'
ORDER BY schemaname, tablename, policyname;

-- Expected: 0 rows
