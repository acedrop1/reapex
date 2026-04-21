-- Simple fix: Ensure public can view active agents
-- Drop and recreate the policy without role specification

DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role = 'agent' AND is_active = true);

