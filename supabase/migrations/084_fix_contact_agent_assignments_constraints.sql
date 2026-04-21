-- Fix foreign key constraints on contact_agent_assignments table
-- to use explicit names and avoid PostgREST ambiguity errors

BEGIN;

-- Drop existing unnamed foreign key constraints
-- Find and drop constraints dynamically
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop foreign key constraints for agent_id
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.contact_agent_assignments'::regclass
        AND contype = 'f'
        AND conname LIKE '%agent_id%'
        AND conname NOT LIKE 'fk_contact_agent_assignments_agent'
    LOOP
        EXECUTE 'ALTER TABLE public.contact_agent_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;

    -- Drop foreign key constraints for assigned_by
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.contact_agent_assignments'::regclass
        AND contype = 'f'
        AND conname LIKE '%assigned_by%'
        AND conname NOT LIKE 'fk_contact_agent_assignments_assigned_by'
    LOOP
        EXECUTE 'ALTER TABLE public.contact_agent_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;

    -- Drop foreign key constraints for contact_id
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.contact_agent_assignments'::regclass
        AND contype = 'f'
        AND conname LIKE '%contact_id%'
        AND conname NOT LIKE 'fk_contact_agent_assignments_contact'
    LOOP
        EXECUTE 'ALTER TABLE public.contact_agent_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;
END $$;

-- Add named foreign key constraints
ALTER TABLE public.contact_agent_assignments
    DROP CONSTRAINT IF EXISTS fk_contact_agent_assignments_contact,
    DROP CONSTRAINT IF EXISTS fk_contact_agent_assignments_agent,
    DROP CONSTRAINT IF EXISTS fk_contact_agent_assignments_assigned_by;

ALTER TABLE public.contact_agent_assignments
    ADD CONSTRAINT fk_contact_agent_assignments_contact
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_contact_agent_assignments_agent
        FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_contact_agent_assignments_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;

COMMIT;

-- Comments
COMMENT ON CONSTRAINT fk_contact_agent_assignments_agent ON public.contact_agent_assignments
    IS 'Foreign key to users table for the assigned agent';
COMMENT ON CONSTRAINT fk_contact_agent_assignments_assigned_by ON public.contact_agent_assignments
    IS 'Foreign key to users table for the admin who made the assignment';
