-- Add public access policy for agents
-- Allow public (unauthenticated) users to view active agents

CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role = 'agent' AND is_active = true);

