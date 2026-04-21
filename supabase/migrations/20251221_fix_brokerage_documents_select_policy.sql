-- Fix RLS policy for viewing brokerage documents
-- Agents need SELECT permission to view documents

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view visible brokerage documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.brokerage_documents;
DROP POLICY IF EXISTS "All users can view visible documents" ON public.brokerage_documents;

-- Create SELECT policy that allows all authenticated users to view visible documents
CREATE POLICY "Authenticated users can view visible brokerage documents"
    ON public.brokerage_documents
    FOR SELECT
    TO authenticated
    USING (is_visible = true);
