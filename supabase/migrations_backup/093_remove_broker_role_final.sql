-- ============================================================================
-- FINAL BROKER ROLE REMOVAL - COMPREHENSIVE
-- ============================================================================
-- Purpose: Remove all references to 'broker' role from the entire database
-- Consolidate to: admin, admin_agent (admin privileges), agent (regular users)
-- ============================================================================

-- ============================================================================
-- STEP 1: Update Helper Function
-- ============================================================================

-- Drop old function if it exists with the old name
DROP FUNCTION IF EXISTS is_admin_or_broker();

-- Create/replace with new function that only checks admin roles
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
-- STEP 2: Update Public Table Policies
-- ============================================================================

-- Agent Agreements
DROP POLICY IF EXISTS "Admins have full access to agreements" ON agent_agreements;
CREATE POLICY "Admins have full access to agreements"
ON agent_agreements FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Agent Applications
DROP POLICY IF EXISTS "Admins can update applications" ON agent_applications;
CREATE POLICY "Admins can update applications"
ON agent_applications FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can view all applications" ON agent_applications;
CREATE POLICY "Admins can view all applications"
ON agent_applications FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
CREATE POLICY "Admins can view all announcements"
ON announcements FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Notifications
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Transaction Documents
DROP POLICY IF EXISTS "Admins can manage all transaction documents" ON transaction_documents;
CREATE POLICY "Admins can manage all transaction documents"
ON transaction_documents FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can view all transaction documents" ON transaction_documents;
CREATE POLICY "Admins can view all transaction documents"
ON transaction_documents FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Transactions
DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
CREATE POLICY "Admins can update all transactions"
ON transactions FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
ON transactions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- ============================================================================
-- STEP 3: Update Storage Policies
-- ============================================================================

-- Announcement Files
DROP POLICY IF EXISTS "Admins can delete announcement files" ON storage.objects;
CREATE POLICY "Admins can delete announcement files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'announcements' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can upload announcement files" ON storage.objects;
CREATE POLICY "Admins can upload announcement files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'announcements' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Application Documents
DROP POLICY IF EXISTS "Admins can delete application documents" ON storage.objects;
CREATE POLICY "Admins can delete application documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'agent-application-documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can view application documents" ON storage.objects;
CREATE POLICY "Admins can view application documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'agent-application-documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Brand Assets
DROP POLICY IF EXISTS "Admins can delete brand assets" ON storage.objects;
CREATE POLICY "Admins can delete brand assets"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'brokerage-documents' AND
    name LIKE 'brand-assets/%' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can update brand assets" ON storage.objects;
CREATE POLICY "Admins can update brand assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'brokerage-documents' AND
    name LIKE 'brand-assets/%' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

DROP POLICY IF EXISTS "Admins can upload brand assets" ON storage.objects;
CREATE POLICY "Admins can upload brand assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'brokerage-documents' AND
    name LIKE 'brand-assets/%' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Agreement Storage
DROP POLICY IF EXISTS "Admins have full access to agreement storage" ON storage.objects;
CREATE POLICY "Admins have full access to agreement storage"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'agent-agreements' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND role IN ('admin', 'admin_agent')
    )
);

-- Marketing Files
DROP POLICY IF EXISTS "Agents can delete own marketing files" ON storage.objects;
CREATE POLICY "Agents can delete own marketing files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'marketing-materials' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    )
);

DROP POLICY IF EXISTS "Agents can view own marketing files" ON storage.objects;
CREATE POLICY "Agents can view own marketing files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'marketing-materials' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    )
);

-- Support Attachments
DROP POLICY IF EXISTS "Agents can delete own support attachments" ON storage.objects;
CREATE POLICY "Agents can delete own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'support-documents' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    )
);

DROP POLICY IF EXISTS "Agents can view own support attachments" ON storage.objects;
CREATE POLICY "Agents can view own support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'support-documents' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND role IN ('admin', 'admin_agent')
        )
    )
);

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check that no policies reference broker role
SELECT
    schemaname,
    tablename,
    policyname,
    CASE
        WHEN qual::text ILIKE '%broker%' THEN 'Found in USING clause'
        WHEN with_check::text ILIKE '%broker%' THEN 'Found in WITH CHECK clause'
        ELSE 'Found in both clauses'
    END as issue_location
FROM pg_policies
WHERE qual::text ILIKE '%broker%'
   OR with_check::text ILIKE '%broker%'
ORDER BY schemaname, tablename, policyname;

-- Expected: 0 rows returned
-- If any rows are returned, those policies still reference 'broker' and need manual review
