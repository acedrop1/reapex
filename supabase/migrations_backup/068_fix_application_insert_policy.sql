-- Fix agent_applications INSERT policy once and for all
-- This migration ensures public can submit applications

-- First, drop ALL existing insert policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Public can submit applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Allow public insert" ON public.agent_applications;

-- Create a permissive policy for INSERT that allows everyone (anon and authenticated)
CREATE POLICY "Public can insert applications"
    ON public.agent_applications
    AS PERMISSIVE
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
