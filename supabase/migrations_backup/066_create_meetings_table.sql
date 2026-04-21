-- Create meetings table for CRM calendar events
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration INTEGER, -- in minutes
    location TEXT,
    notes TEXT,
    attendees TEXT[], -- Array of email addresses
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Agents can view their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Agents can create their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Agents can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Agents can delete their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admins can view all meetings" ON public.meetings;

-- RLS Policies for meetings
-- Agents can manage their own meetings
CREATE POLICY "Agents can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own meetings"
ON public.meetings
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

-- Admins can view all meetings
CREATE POLICY "Admins can view all meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meetings_agent_id ON public.meetings(agent_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON public.meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS meetings_updated_at ON public.meetings;

CREATE TRIGGER meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_meetings_updated_at();
