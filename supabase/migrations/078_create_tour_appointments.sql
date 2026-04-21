-- Create tour_appointments table for scheduling property tours
CREATE TABLE IF NOT EXISTS public.tour_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(20) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_email VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tour_appointments_agent_id ON public.tour_appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_tour_appointments_listing_id ON public.tour_appointments(listing_id);
CREATE INDEX IF NOT EXISTS idx_tour_appointments_scheduled_date ON public.tour_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tour_appointments_status ON public.tour_appointments(status);

-- Add RLS policies
ALTER TABLE public.tour_appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view their own tour appointments" ON public.tour_appointments;
DROP POLICY IF EXISTS "Anyone can schedule a tour" ON public.tour_appointments;
DROP POLICY IF EXISTS "Agents and admins can update tour appointments" ON public.tour_appointments;

-- Agents can view their own appointments
CREATE POLICY "Agents can view their own tour appointments"
    ON public.tour_appointments
    FOR SELECT
    USING (
        auth.uid() = agent_id
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Allow public insert for scheduling tours
CREATE POLICY "Anyone can schedule a tour"
    ON public.tour_appointments
    FOR INSERT
    WITH CHECK (true);

-- Only agents and admins can update appointments
CREATE POLICY "Agents and admins can update tour appointments"
    ON public.tour_appointments
    FOR UPDATE
    USING (
        auth.uid() = agent_id
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_tour_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tour_appointments_updated_at ON public.tour_appointments;
CREATE TRIGGER update_tour_appointments_updated_at
    BEFORE UPDATE ON public.tour_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_appointments_updated_at();

-- Add comment
COMMENT ON TABLE public.tour_appointments IS 'Stores scheduled property tour appointments between visitors and agents';
