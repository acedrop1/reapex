-- Create contact activities table for tracking all interactions and messages
-- Add admin policies for master CRM access

BEGIN;

-- =============================================================================
-- CONTACT ACTIVITIES: Track all contact interactions and messages
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.contact_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- email, call, meeting, note, sms, form_submission, assignment
    subject TEXT,
    body TEXT,
    direction TEXT, -- inbound, outbound
    status TEXT, -- completed, scheduled, cancelled
    metadata JSONB, -- Store additional data like email headers, call duration, etc.
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_activities
CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id
    ON public.contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_agent_id
    ON public.contact_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_type
    ON public.contact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_contact_activities_occurred_at
    ON public.contact_activities(occurred_at DESC);

-- Enable RLS
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_contact_activities_updated_at ON public.contact_activities;
CREATE TRIGGER update_contact_activities_updated_at BEFORE UPDATE
    ON public.contact_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ADMIN POLICIES: Allow admins to view and manage ALL contacts
-- =============================================================================

-- Admins can view all contacts
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
CREATE POLICY "Admins can view all contacts"
    ON public.contacts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can update any contact (for assignment, etc.)
DROP POLICY IF EXISTS "Admins can update all contacts" ON public.contacts;
CREATE POLICY "Admins can update all contacts"
    ON public.contacts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can delete any contact
DROP POLICY IF EXISTS "Admins can delete all contacts" ON public.contacts;
CREATE POLICY "Admins can delete all contacts"
    ON public.contacts FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =============================================================================
-- CONTACT ACTIVITIES POLICIES
-- =============================================================================

-- Agents can view activities for their assigned contacts
DROP POLICY IF EXISTS "Agents can view their contact activities" ON public.contact_activities;
CREATE POLICY "Agents can view their contact activities"
    ON public.contact_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_activities.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

-- Agents can create activities for their contacts
DROP POLICY IF EXISTS "Agents can create activities for their contacts" ON public.contact_activities;
CREATE POLICY "Agents can create activities for their contacts"
    ON public.contact_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_activities.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

-- Admins can view all contact activities
DROP POLICY IF EXISTS "Admins can view all contact activities" ON public.contact_activities;
CREATE POLICY "Admins can view all contact activities"
    ON public.contact_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can create activities for any contact
DROP POLICY IF EXISTS "Admins can create activities for any contact" ON public.contact_activities;
CREATE POLICY "Admins can create activities for any contact"
    ON public.contact_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can update any activity
DROP POLICY IF EXISTS "Admins can update all activities" ON public.contact_activities;
CREATE POLICY "Admins can update all activities"
    ON public.contact_activities FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =============================================================================
-- DEALS POLICIES FOR ADMIN
-- =============================================================================

-- Admins can view all deals
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
CREATE POLICY "Admins can view all deals"
    ON public.deals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

COMMIT;

-- Comments
COMMENT ON TABLE public.contact_activities IS 'Tracks all contact interactions including emails, calls, notes, and form submissions';
COMMENT ON COLUMN public.contact_activities.activity_type IS 'Type of activity: email, call, meeting, note, sms, form_submission, assignment';
COMMENT ON COLUMN public.contact_activities.direction IS 'Direction of communication: inbound (from contact) or outbound (to contact)';
COMMENT ON COLUMN public.contact_activities.metadata IS 'Additional data in JSONB format for flexibility';
