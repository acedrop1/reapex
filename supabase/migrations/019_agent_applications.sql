-- Agent Applications System
-- Migration for agent onboarding application flow

-- Create application status enum (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sales volume range enum (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE sales_volume_range AS ENUM ('under_2m', '2m_8m', 'over_8m');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agent applications table
CREATE TABLE public.agent_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    license_number TEXT NOT NULL,
    transactions_12_months INTEGER NOT NULL,
    sales_volume_range sales_volume_range NOT NULL,
    commission_plans TEXT[] NOT NULL DEFAULT '{}',
    photo_id_url TEXT,
    status application_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status filtering
CREATE INDEX idx_agent_applications_status ON public.agent_applications(status);
CREATE INDEX idx_agent_applications_created_at ON public.agent_applications(created_at DESC);
CREATE INDEX idx_agent_applications_email ON public.agent_applications(email);

-- Enable RLS
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
    ON public.agent_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Admins can update applications
CREATE POLICY "Admins can update applications"
    ON public.agent_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Allow public insert (for application submission)
CREATE POLICY "Anyone can submit applications"
    ON public.agent_applications FOR INSERT
    WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_agent_applications_updated_at BEFORE UPDATE ON public.agent_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for application documents
-- Note: This should be created in Supabase dashboard or via supabase storage API
-- Bucket name: agent-application-documents
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, application/pdf

-- Storage RLS policies will be:
-- 1. Anyone can upload (for initial submission)
-- 2. Only admins can read all files
-- 3. Applicants can read their own files (if we add user_id tracking)
