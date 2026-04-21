-- Create external_links table for managing resource links
-- Admins can add/edit/delete external resource links with logos and descriptions

BEGIN;

-- =============================================================================
-- EXTERNAL_LINKS: Store external resource links with logos and descriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.external_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    logo_url TEXT, -- Storage path to uploaded logo image
    color VARCHAR(20) DEFAULT '#2196F3', -- Hex color for card accent
    display_order INTEGER DEFAULT 0, -- For manual sorting
    is_active BOOLEAN DEFAULT true, -- Show/hide without deleting
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_links_active ON public.external_links(is_active);
CREATE INDEX IF NOT EXISTS idx_external_links_order ON public.external_links(display_order);

-- Enable RLS
ALTER TABLE public.external_links ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR EXTERNAL_LINKS
-- =============================================================================

-- All authenticated users (agents and admins) can view active links
CREATE POLICY "Authenticated users can view active external links"
    ON public.external_links FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can view all links (including inactive)
CREATE POLICY "Admins can view all external links"
    ON public.external_links FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can create links
CREATE POLICY "Admins can create external links"
    ON public.external_links FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can update links
CREATE POLICY "Admins can update external links"
    ON public.external_links FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can delete links
CREATE POLICY "Admins can delete external links"
    ON public.external_links FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =============================================================================
-- SEED DATA: Add default RPR link
-- =============================================================================
INSERT INTO public.external_links (title, description, url, color, display_order, is_active)
VALUES (
    'RPR (Realtors Property Resource)',
    'Access comprehensive property data, market analytics, and valuation tools',
    'https://www.narrpr.com/home',
    '#2196F3',
    1,
    true
) ON CONFLICT DO NOTHING;

COMMIT;

-- Comments
COMMENT ON TABLE public.external_links IS 'External resource links with logos and descriptions managed by admins';
COMMENT ON COLUMN public.external_links.logo_url IS 'Storage path to uploaded logo image in external-links bucket';
COMMENT ON COLUMN public.external_links.color IS 'Hex color code for card accent and icon background';
COMMENT ON COLUMN public.external_links.display_order IS 'Manual sort order (lower numbers appear first)';
