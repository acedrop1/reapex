-- Fix listings INSERT policy to include broker role
-- Date: 2025-12-22
-- Description: Add broker role to admin-level permissions for listings INSERT
-- The previous migration excluded broker role, causing permission errors for broker users

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;

-- Create updated INSERT policy that includes all admin-level roles
CREATE POLICY "Users can insert listings"
    ON public.listings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Agents can only create listings for themselves
        (agent_id = auth.uid())
        OR
        -- Admins, brokers, and admin_agents can create listings for any agent
        (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'admin_agent', 'broker')
            )
        )
    );

COMMENT ON POLICY "Users can insert listings" ON public.listings IS
    'Allows agents to create their own listings. Admins, brokers, and admin_agents can create listings for any agent';
