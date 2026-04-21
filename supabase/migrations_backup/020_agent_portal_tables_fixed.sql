-- Agent Portal Tables Migration (Fixed)
-- Handles existing tables and adds missing columns

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Agents can view own marketing requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Agents can create marketing requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Admins can update marketing requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Agents can view own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Agents can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Agents can view own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;
DROP POLICY IF EXISTS "Anyone can view active brand assets" ON public.brand_assets;
DROP POLICY IF EXISTS "Anyone can view active training resources" ON public.training_resources;
DROP POLICY IF EXISTS "Anyone can view active directory entries" ON public.company_directory;

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'type') THEN
        ALTER TABLE public.announcements ADD COLUMN type TEXT DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event', 'reminder'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'link_url') THEN
        ALTER TABLE public.announcements ADD COLUMN link_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'link_text') THEN
        ALTER TABLE public.announcements ADD COLUMN link_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'published_at') THEN
        ALTER TABLE public.announcements ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'expires_at') THEN
        ALTER TABLE public.announcements ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'created_by') THEN
        ALTER TABLE public.announcements ADD COLUMN created_by UUID REFERENCES public.users(id);
    END IF;
END $$;

-- Marketing requests table
CREATE TABLE IF NOT EXISTS public.marketing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.users(id) NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('custom_design', 'listing_launch', 'social_media', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    deadline DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    file_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.users(id) NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'tech', 'compliance', 'billing', 'broker_question')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission tracking table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.users(id) NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id),
    property_address TEXT,
    close_date DATE,
    gross_commission DECIMAL(12, 2) NOT NULL,
    split_percentage DECIMAL(5, 2) DEFAULT 80.00,
    agent_commission DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand assets/resources table
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('logo', 'template', 'guide', 'graphic', 'video')),
    file_url TEXT NOT NULL,
    file_type TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training resources table
CREATE TABLE IF NOT EXISTS public.training_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('onboarding', 'tech', 'compliance', 'marketing', 'sales')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'document', 'link', 'course')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company directory/people table
CREATE TABLE IF NOT EXISTS public.company_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    bio TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_directory ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Announcements: Everyone can read active announcements
CREATE POLICY "Anyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (
        (published_at IS NULL OR published_at <= NOW()) AND
        (expires_at IS NULL OR expires_at > NOW())
    );

-- Marketing requests: Agents can view/create their own, admins can view all
CREATE POLICY "Agents can view own marketing requests"
    ON public.marketing_requests FOR SELECT
    USING (agent_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

CREATE POLICY "Agents can create marketing requests"
    ON public.marketing_requests FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins can update marketing requests"
    ON public.marketing_requests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

-- Support tickets: Similar to marketing requests
CREATE POLICY "Agents can view own support tickets"
    ON public.support_tickets FOR SELECT
    USING (agent_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

CREATE POLICY "Agents can create support tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins can update support tickets"
    ON public.support_tickets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

-- Commissions: Agents can view their own, admins can view/manage all
CREATE POLICY "Agents can view own commissions"
    ON public.commissions FOR SELECT
    USING (agent_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

CREATE POLICY "Admins can manage commissions"
    ON public.commissions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')
    ));

-- Brand assets: Everyone can read active assets
CREATE POLICY "Anyone can view active brand assets"
    ON public.brand_assets FOR SELECT
    USING (is_active = true);

-- Training resources: Everyone can read active resources
CREATE POLICY "Anyone can view active training resources"
    ON public.training_resources FOR SELECT
    USING (is_active = true);

-- Company directory: Everyone can read active entries
CREATE POLICY "Anyone can view active directory entries"
    ON public.company_directory FOR SELECT
    USING (is_active = true);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_agent ON public.marketing_requests(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_agent ON public.support_tickets(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON public.commissions(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON public.brand_assets(category, is_active);
CREATE INDEX IF NOT EXISTS idx_training_category ON public.training_resources(category, is_active);

-- Triggers for updated_at (drop if exist first)
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
DROP TRIGGER IF EXISTS update_marketing_requests_updated_at ON public.marketing_requests;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS update_commissions_updated_at ON public.commissions;
DROP TRIGGER IF EXISTS update_brand_assets_updated_at ON public.brand_assets;
DROP TRIGGER IF EXISTS update_training_resources_updated_at ON public.training_resources;
DROP TRIGGER IF EXISTS update_company_directory_updated_at ON public.company_directory;

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_requests_updated_at BEFORE UPDATE ON public.marketing_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_assets_updated_at BEFORE UPDATE ON public.brand_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_resources_updated_at BEFORE UPDATE ON public.training_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_directory_updated_at BEFORE UPDATE ON public.company_directory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
