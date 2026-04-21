-- Reapex Agent Portal - Database Schema
-- Supabase PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure uuid_generate_v4 function exists (create if extension didn't create it)
CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Create custom types
CREATE TYPE user_role AS ENUM ('agent', 'admin', 'broker');
CREATE TYPE transaction_status AS ENUM ('pending', 'under_contract', 'closed', 'cancelled');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE event_type AS ENUM ('task', 'appointment', 'transaction', 'company');
CREATE TYPE event_source AS ENUM ('task', 'transaction', 'custom', 'deal');
CREATE TYPE resource_type AS ENUM ('video', 'document', 'faq');
CREATE TYPE integration_service AS ENUM ('follow_up_boss', 'quickbooks', 'zipforms', 'rpr', 'canva');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'agent',
    headshot_url TEXT,
    bio TEXT,
    cap_amount DECIMAL(12, 2) DEFAULT 0,
    current_cap_progress DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_address TEXT NOT NULL,
    property_city TEXT NOT NULL,
    property_state TEXT NOT NULL,
    property_zip TEXT NOT NULL,
    listing_price DECIMAL(12, 2),
    sale_price DECIMAL(12, 2),
    gci DECIMAL(12, 2) NOT NULL DEFAULT 0,
    agent_split_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    agent_commission DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status transaction_status NOT NULL DEFAULT 'pending',
    closing_date DATE,
    contingency_date DATE,
    listing_date DATE,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    priority announcement_priority NOT NULL DEFAULT 'medium',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    event_type event_type NOT NULL,
    source event_source NOT NULL,
    source_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property websites table
CREATE TABLE public.property_websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    is_published BOOLEAN DEFAULT false,
    custom_domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training resources table
CREATE TABLE public.training_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    resource_type resource_type NOT NULL,
    video_url TEXT,
    document_url TEXT,
    category TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration tokens table (for OAuth tokens)
CREATE TABLE public.integration_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service integration_service NOT NULL,
    access_token TEXT NOT NULL, -- Should be encrypted in production
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service)
);

-- Indexes for performance
CREATE INDEX idx_transactions_agent_id ON public.transactions(agent_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_closing_date ON public.transactions(closing_date);
CREATE INDEX idx_calendar_events_agent_id ON public.calendar_events(agent_id);
CREATE INDEX idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX idx_announcements_published_at ON public.announcements(published_at);
CREATE INDEX idx_integration_tokens_user_service ON public.integration_tokens(user_id, service);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Agents can view their own transactions"
    ON public.transactions FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
    ON public.transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

CREATE POLICY "Agents can create their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Admins can update all transactions"
    ON public.transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Announcements policies
CREATE POLICY "All authenticated users can view published announcements"
    ON public.announcements FOR SELECT
    USING (published_at IS NOT NULL AND published_at <= NOW());

CREATE POLICY "Admins can view all announcements"
    ON public.announcements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

CREATE POLICY "Admins can create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

CREATE POLICY "Admins can update announcements"
    ON public.announcements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Calendar events policies
CREATE POLICY "Users can view their own events and company events"
    ON public.calendar_events FOR SELECT
    USING (
        agent_id = auth.uid() OR 
        agent_id IS NULL
    );

CREATE POLICY "Users can create their own events"
    ON public.calendar_events FOR INSERT
    WITH CHECK (agent_id = auth.uid() OR agent_id IS NULL);

CREATE POLICY "Users can update their own events"
    ON public.calendar_events FOR UPDATE
    USING (agent_id = auth.uid());

-- Property websites policies
CREATE POLICY "Users can view property websites for their transactions"
    ON public.property_websites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = property_websites.transaction_id
            AND transactions.agent_id = auth.uid()
        )
    );

CREATE POLICY "Users can create property websites for their transactions"
    ON public.property_websites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = property_websites.transaction_id
            AND transactions.agent_id = auth.uid()
        )
    );

-- Training resources policies
CREATE POLICY "All authenticated users can view training resources"
    ON public.training_resources FOR SELECT
    USING (true);

-- Integration tokens policies
CREATE POLICY "Users can manage their own integration tokens"
    ON public.integration_tokens FOR ALL
    USING (user_id = auth.uid());

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_websites_updated_at BEFORE UPDATE ON public.property_websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_resources_updated_at BEFORE UPDATE ON public.training_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_tokens_updated_at BEFORE UPDATE ON public.integration_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync user from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

