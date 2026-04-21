-- Create many-to-many relationship for contact-agent assignments
-- A contact can be assigned to multiple agents (e.g., contacted agent A then agent B)

BEGIN;

-- =============================================================================
-- CONTACT_AGENT_ASSIGNMENTS: Many-to-many relationship table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.contact_agent_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID, -- admin who assigned, or NULL for self-assignment via form
    is_primary BOOLEAN DEFAULT false, -- Mark one agent as primary for the contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, agent_id), -- Prevent duplicate assignments

    -- Named foreign key constraints to avoid ambiguity
    CONSTRAINT fk_contact_agent_assignments_contact
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_agent_assignments_agent
        FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_agent_assignments_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_agent_assignments_contact
    ON public.contact_agent_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_agent_assignments_agent
    ON public.contact_agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_agent_assignments_primary
    ON public.contact_agent_assignments(is_primary)
    WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.contact_agent_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR CONTACT_AGENT_ASSIGNMENTS
-- =============================================================================

-- Agents can view their own assignments
DROP POLICY IF EXISTS "Agents can view their assignments" ON public.contact_agent_assignments;
CREATE POLICY "Agents can view their assignments"
    ON public.contact_agent_assignments FOR SELECT
    TO authenticated
    USING (agent_id = auth.uid());

-- Admins can view all assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.contact_agent_assignments;
CREATE POLICY "Admins can view all assignments"
    ON public.contact_agent_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can create assignments
DROP POLICY IF EXISTS "Admins can create assignments" ON public.contact_agent_assignments;
CREATE POLICY "Admins can create assignments"
    ON public.contact_agent_assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Public can create assignments (for agent contact forms)
DROP POLICY IF EXISTS "Public can create assignments" ON public.contact_agent_assignments;
CREATE POLICY "Public can create assignments"
    ON public.contact_agent_assignments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can delete assignments
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.contact_agent_assignments;
CREATE POLICY "Admins can delete assignments"
    ON public.contact_agent_assignments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =============================================================================
-- UPDATE EXISTING CONTACTS: Migrate agent_id to assignments table
-- =============================================================================

-- For existing contacts with agent_id, create assignment records
INSERT INTO public.contact_agent_assignments (contact_id, agent_id, is_primary, assigned_at)
SELECT id, agent_id, true, created_at
FROM public.contacts
WHERE agent_id IS NOT NULL
ON CONFLICT (contact_id, agent_id) DO NOTHING;

-- =============================================================================
-- UPDATE AGENT CRM POLICIES: Now based on assignments, not agent_id
-- =============================================================================

-- Drop old agent policies for contacts
DROP POLICY IF EXISTS "Agents can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can delete their own contacts" ON public.contacts;

-- New policies based on assignments
DROP POLICY IF EXISTS "Agents can view their assigned contacts" ON public.contacts;
CREATE POLICY "Agents can view their assigned contacts"
    ON public.contacts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contact_agent_assignments
            WHERE contact_agent_assignments.contact_id = contacts.id
            AND contact_agent_assignments.agent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their assigned contacts" ON public.contacts;
CREATE POLICY "Agents can update their assigned contacts"
    ON public.contacts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contact_agent_assignments
            WHERE contact_agent_assignments.contact_id = contacts.id
            AND contact_agent_assignments.agent_id = auth.uid()
        )
    );

-- Update contact activities policies to use assignments
DROP POLICY IF EXISTS "Agents can view their contact activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Agents can create activities for their contacts" ON public.contact_activities;
DROP POLICY IF EXISTS "Agents can view activities for assigned contacts" ON public.contact_activities;
DROP POLICY IF EXISTS "Agents can create activities for assigned contacts" ON public.contact_activities;

CREATE POLICY "Agents can view activities for assigned contacts"
    ON public.contact_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contact_agent_assignments
            WHERE contact_agent_assignments.contact_id = contact_activities.contact_id
            AND contact_agent_assignments.agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can create activities for assigned contacts"
    ON public.contact_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contact_agent_assignments
            WHERE contact_agent_assignments.contact_id = contact_activities.contact_id
            AND contact_agent_assignments.agent_id = auth.uid()
        )
    );

COMMIT;

-- Comments
COMMENT ON TABLE public.contact_agent_assignments IS 'Many-to-many relationship allowing contacts to be assigned to multiple agents';
COMMENT ON COLUMN public.contact_agent_assignments.is_primary IS 'Indicates the primary agent responsible for this contact';
COMMENT ON COLUMN public.contact_agent_assignments.assigned_by IS 'Admin who made the assignment, or NULL if auto-assigned via form submission';
