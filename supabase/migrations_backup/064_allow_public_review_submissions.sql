-- Migration: Allow Public Review Submissions
-- Description: Allows public users to submit reviews for agent approval
-- Date: 2025-01-29

-- Drop the existing admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert reviews" ON agent_reviews;

-- Create new policy: Allow anyone (including unauthenticated) to submit reviews
-- Reviews will default to is_approved = false and require admin approval
CREATE POLICY "Anyone can submit reviews for approval"
ON agent_reviews
FOR INSERT
TO public
WITH CHECK (is_approved = false);

-- Add comment for documentation
COMMENT ON POLICY "Anyone can submit reviews for approval" ON agent_reviews IS
'Allows public users to submit reviews which default to unapproved status. Only admins can approve reviews via UPDATE policy.';
