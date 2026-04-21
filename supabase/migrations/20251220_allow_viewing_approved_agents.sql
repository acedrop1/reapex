-- Allow all authenticated users to view approved agents
-- This enables the /agents public page to show agents to logged-in users

DROP POLICY IF EXISTS "Authenticated users can view approved agents" ON public.users;

CREATE POLICY "Authenticated users can view approved agents"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        account_status = 'approved'
        AND role IN ('agent', 'admin_agent')
    );

COMMENT ON POLICY "Authenticated users can view approved agents" ON public.users IS
'Allows all authenticated users to view approved agents and admin_agents for the public agents directory page.';
