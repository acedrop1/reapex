-- Add admin_agent enum value to user_role type
-- This must be in a separate migration from where it's used due to PostgreSQL transaction requirements

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin_agent';

-- Add comment explaining the role
COMMENT ON TYPE user_role IS 'User roles: agent (standard agent), admin (system administrator), admin_agent (dual role with both admin and agent permissions)';
