-- Additional tables for self-contained CRM functionality
-- Run this after the initial schema

-- Tasks table (replaces FUB tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium', -- low, medium, high
    related_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads/Contacts table (replaces FUB CRM)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
    source TEXT, -- website, referral, etc.
    notes TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline/Deals table (replaces FUB pipeline)
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'lead', -- lead, qualified, proposal, negotiation, closed, lost
    value DECIMAL(12, 2),
    probability INTEGER DEFAULT 0, -- 0-100
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_contacts_agent_id ON public.contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_deals_agent_id ON public.deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- RLS Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Agents can view their own tasks"
    ON public.tasks FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (agent_id = auth.uid());

-- Contacts policies
CREATE POLICY "Agents can view their own contacts"
    ON public.contacts FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own contacts"
    ON public.contacts FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own contacts"
    ON public.contacts FOR DELETE
    USING (agent_id = auth.uid());

-- Deals policies
CREATE POLICY "Agents can view their own deals"
    ON public.deals FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own deals"
    ON public.deals FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own deals"
    ON public.deals FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own deals"
    ON public.deals FOR DELETE
    USING (agent_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

