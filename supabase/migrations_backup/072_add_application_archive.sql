-- Add archive functionality to agent applications
-- Allows admins to archive applications to keep the list clean

BEGIN;

-- Add archived column
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering archived applications
CREATE INDEX IF NOT EXISTS idx_agent_applications_archived
ON agent_applications(archived);

-- Create composite index for status + archived filtering
CREATE INDEX IF NOT EXISTS idx_agent_applications_status_archived
ON agent_applications(status, archived);

COMMIT;

COMMENT ON COLUMN agent_applications.archived IS
'Flag to archive applications. Archived applications are hidden from the main list but can be retrieved if needed.';
