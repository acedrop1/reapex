-- Fix listings INSERT policy to allow both agents and admins
-- Agents can only create listings for themselves
-- Admins can create listings for any agent

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Agents can create their own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can insert listings for any agent" ON public.listings;
DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;

-- Create combined INSERT policy
CREATE POLICY "Users can insert listings"
    ON public.listings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Agents can only create listings for themselves
        (agent_id = auth.uid())
        OR
        -- Admins can create listings for any agent
        (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent')
            )
        )
    );

COMMENT ON POLICY "Users can insert listings" ON public.listings IS
    'Allows agents to create their own listings and admins to create listings for any agent';
