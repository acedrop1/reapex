-- Agent Portal Tables Migration (Complete Safe Version)
-- Handles all edge cases and ensures all columns exist

-- ============================================
-- STEP 1: Create tables with minimal schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    gross_commission DECIMAL(12, 2) NOT NULL,
    agent_commission DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brand_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Add all missing columns
-- ============================================

-- Add columns to announcements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'type') THEN
        ALTER TABLE public.announcements ADD COLUMN type TEXT DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'link_url') THEN
        ALTER TABLE public.announcements ADD COLUMN link_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'link_text') THEN
        ALTER TABLE public.announcements ADD COLUMN link_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'published_at') THEN
        ALTER TABLE public.announcements ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'expires_at') THEN
        ALTER TABLE public.announcements ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'created_by') THEN
        ALTER TABLE public.announcements ADD COLUMN created_by UUID;
    END IF;
END $$;

-- Add columns to marketing_requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'request_type') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN request_type TEXT NOT NULL DEFAULT 'other';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'description') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'deadline') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN deadline DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'status') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'completed_at') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'file_urls') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN file_urls TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketing_requests' AND column_name = 'notes') THEN
        ALTER TABLE public.marketing_requests ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add columns to support_tickets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'category') THEN
        ALTER TABLE public.support_tickets ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'priority') THEN
        ALTER TABLE public.support_tickets ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'status') THEN
        ALTER TABLE public.support_tickets ADD COLUMN status TEXT DEFAULT 'open';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.support_tickets ADD COLUMN assigned_to UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'resolved_at') THEN
        ALTER TABLE public.support_tickets ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add columns to commissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'transaction_id') THEN
        ALTER TABLE public.commissions ADD COLUMN transaction_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'property_address') THEN
        ALTER TABLE public.commissions ADD COLUMN property_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'close_date') THEN
        ALTER TABLE public.commissions ADD COLUMN close_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'split_percentage') THEN
        ALTER TABLE public.commissions ADD COLUMN split_percentage DECIMAL(5, 2) DEFAULT 80.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'status') THEN
        ALTER TABLE public.commissions ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'paid_date') THEN
        ALTER TABLE public.commissions ADD COLUMN paid_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'notes') THEN
        ALTER TABLE public.commissions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add columns to brand_assets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'description') THEN
        ALTER TABLE public.brand_assets ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'category') THEN
        ALTER TABLE public.brand_assets ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'file_type') THEN
        ALTER TABLE public.brand_assets ADD COLUMN file_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.brand_assets ADD COLUMN thumbnail_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'tags') THEN
        ALTER TABLE public.brand_assets ADD COLUMN tags TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brand_assets' AND column_name = 'is_active') THEN
        ALTER TABLE public.brand_assets ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add columns to training_resources
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'description') THEN
        ALTER TABLE public.training_resources ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'category') THEN
        ALTER TABLE public.training_resources ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'resource_type') THEN
        ALTER TABLE public.training_resources ADD COLUMN resource_type TEXT NOT NULL DEFAULT 'link';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.training_resources ADD COLUMN thumbnail_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.training_resources ADD COLUMN duration_minutes INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'order_index') THEN
        ALTER TABLE public.training_resources ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'is_required') THEN
        ALTER TABLE public.training_resources ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_resources' AND column_name = 'is_active') THEN
        ALTER TABLE public.training_resources ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add columns to company_directory
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'department') THEN
        ALTER TABLE public.company_directory ADD COLUMN department TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'email') THEN
        ALTER TABLE public.company_directory ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'phone') THEN
        ALTER TABLE public.company_directory ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'photo_url') THEN
        ALTER TABLE public.company_directory ADD COLUMN photo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'bio') THEN
        ALTER TABLE public.company_directory ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'order_index') THEN
        ALTER TABLE public.company_directory ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_directory' AND column_name = 'is_active') THEN
        ALTER TABLE public.company_directory ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_directory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies
-- ============================================

-- Drop and recreate announcements policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
    CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT
        USING ((published_at IS NULL OR published_at <= NOW()) AND (expires_at IS NULL OR expires_at > NOW()));
END $$;

-- Drop and recreate marketing_requests policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Agents can view own marketing requests" ON public.marketing_requests;
    DROP POLICY IF EXISTS "Agents can create marketing requests" ON public.marketing_requests;
    DROP POLICY IF EXISTS "Admins can update marketing requests" ON public.marketing_requests;

    CREATE POLICY "Agents can view own marketing requests" ON public.marketing_requests FOR SELECT
        USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));

    CREATE POLICY "Agents can create marketing requests" ON public.marketing_requests FOR INSERT
        WITH CHECK (agent_id = auth.uid());

    CREATE POLICY "Admins can update marketing requests" ON public.marketing_requests FOR UPDATE
        USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));
END $$;

-- Drop and recreate support_tickets policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Agents can view own support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Agents can create support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;

    CREATE POLICY "Agents can view own support tickets" ON public.support_tickets FOR SELECT
        USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));

    CREATE POLICY "Agents can create support tickets" ON public.support_tickets FOR INSERT
        WITH CHECK (agent_id = auth.uid());

    CREATE POLICY "Admins can update support tickets" ON public.support_tickets FOR UPDATE
        USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));
END $$;

-- Drop and recreate commissions policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Agents can view own commissions" ON public.commissions;
    DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;

    CREATE POLICY "Agents can view own commissions" ON public.commissions FOR SELECT
        USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));

    CREATE POLICY "Admins can manage commissions" ON public.commissions FOR ALL
        USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')));
END $$;

-- Drop and recreate brand_assets policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active brand assets" ON public.brand_assets;
    CREATE POLICY "Anyone can view active brand assets" ON public.brand_assets FOR SELECT USING (is_active = true);
END $$;

-- Drop and recreate training_resources policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active training resources" ON public.training_resources;
    CREATE POLICY "Anyone can view active training resources" ON public.training_resources FOR SELECT USING (is_active = true);
END $$;

-- Drop and recreate company_directory policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active directory entries" ON public.company_directory;
    CREATE POLICY "Anyone can view active directory entries" ON public.company_directory FOR SELECT USING (is_active = true);
END $$;

-- ============================================
-- STEP 5: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_agent ON public.marketing_requests(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_agent ON public.support_tickets(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON public.commissions(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON public.brand_assets(category, is_active);
CREATE INDEX IF NOT EXISTS idx_training_category ON public.training_resources(category, is_active);

-- ============================================
-- STEP 6: Create Triggers
-- ============================================

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
