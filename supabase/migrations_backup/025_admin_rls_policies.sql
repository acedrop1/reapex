-- Migration: Add admin RLS policies for listings and users
-- Created: 2025-01-24

-- Add admin policies for listings
-- Admins can view all listings
CREATE POLICY "Admins can view all listings"
    ON public.listings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Admins can update all listings
CREATE POLICY "Admins can update all listings"
    ON public.listings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Admins can delete all listings
CREATE POLICY "Admins can delete all listings"
    ON public.listings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Add admin policy for updating all user profiles
CREATE POLICY "Admins can update all user profiles"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'broker')
        )
    );

-- Add admin policy for deleting users
CREATE POLICY "Admins can delete users"
    ON public.users FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'broker')
        )
    );
