-- Add relationship hints for PostgREST to resolve ambiguous foreign keys
-- This fixes the "more than one relationship found" error

BEGIN;

-- Add comments to foreign key constraints to help PostgREST identify relationships
COMMENT ON CONSTRAINT fk_contact_agent_assignments_agent
    ON public.contact_agent_assignments
    IS '@foreignFieldName assignments_as_agent';

COMMENT ON CONSTRAINT fk_contact_agent_assignments_assigned_by
    ON public.contact_agent_assignments
    IS '@foreignFieldName assignments_created';

-- Drop existing views if they exist (to remove SECURITY DEFINER property)
DROP VIEW IF EXISTS contact_assignments_with_agent;
DROP VIEW IF EXISTS contact_assignments_with_assigner;

COMMIT;

-- Note: Views were removed to eliminate SECURITY DEFINER warnings
-- Use explicit foreign key syntax in queries instead:
-- agent:users!fk_contact_agent_assignments_agent(...)
-- assigned_by_user:users!fk_contact_agent_assignments_assigned_by(...)
