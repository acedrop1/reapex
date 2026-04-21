-- Add listings and agents tables to match public website
-- Run after initial schema

-- Listings table (matches public website listings)
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL, -- apartment, single_family_home, condo, villa, office, shop, studio
    listing_type TEXT NOT NULL, -- for_sale, for_rent
    property_address TEXT NOT NULL,
    property_city TEXT NOT NULL,
    property_state TEXT NOT NULL,
    property_zip TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    price_period TEXT, -- yearly, monthly (for rentals)
    bedrooms INTEGER,
    bathrooms INTEGER,
    garages INTEGER,
    square_feet INTEGER,
    description TEXT,
    featured BOOLEAN DEFAULT false,
    open_house BOOLEAN DEFAULT false,
    property_reference TEXT UNIQUE, -- e.g., "Reapex - HZ-10"
    images TEXT[], -- Array of image URLs
    status TEXT DEFAULT 'active', -- active, pending, sold, rented, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent profiles/public info (extends users table)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_agent_id ON public.listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(featured);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(property_city);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- RLS Policies
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Agents can view their own listings"
    ON public.listings FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Public can view active listings"
    ON public.listings FOR SELECT
    USING (status = 'active');

CREATE POLICY "Agents can create their own listings"
    ON public.listings FOR INSERT
    WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own listings"
    ON public.listings FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own listings"
    ON public.listings FOR DELETE
    USING (agent_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

